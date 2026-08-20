#!/bin/bash
set -eux

# Redirect stdout and stderr to a log file for troubleshooting
exec > >(tee -a /var/log/user-data.log) 2>&1

echo "=========================================="
echo "Starting PocketFlow ASG Bootstrap"
echo "=========================================="

##############################################
# Update Ubuntu & Install Dependencies
##############################################
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl unzip git gnupg lsb-release wget

##############################################
# Install Docker & Docker Compose Plugin
##############################################
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

# Add ubuntu to docker group
usermod -aG docker ubuntu

##############################################
# Install AWS CLI v2
##############################################
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip -o awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

##############################################
# Install CloudWatch Agent
##############################################
cd /tmp
wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O amazon-cloudwatch-agent.deb
dpkg -i -E amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

##############################################
# Create Project Structure
##############################################
mkdir -p /home/ubuntu/PocketFlow/nginx
cd /home/ubuntu/PocketFlow

##############################################
# Write Nginx Config Inline
##############################################
cat << 'EOF' > nginx/nginx.conf
events {}

http {
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;

        location /api/ {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

cat << 'EOF' > nginx/Dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
EOF

##############################################
# Write Docker Compose Config Inline
##############################################
cat << 'EOF' > docker-compose.prod.yml
services:
  backend:
    image: 831959027398.dkr.ecr.us-east-1.amazonaws.com/pocketflow-production-backend:latest
    container_name: pocketflow-backend
    restart: unless-stopped
    env_file:
      - .env
    environment:
      PYTHONUNBUFFERED: "1"
      FIREBASE_SERVICE_ACCOUNT_B64: ${FIREBASE_SERVICE_ACCOUNT_B64}

  nginx:
    build:
      context: ./nginx
    container_name: pocketflow-nginx
    depends_on:
      - backend
    ports:
      - "80:80"
    restart: unless-stopped
EOF

##############################################
# Query Secrets from SSM Parameter Store
##############################################
export AWS_DEFAULT_REGION=us-east-1

echo "Fetching application secrets from SSM..."
FIREBASE_SERVICE_ACCOUNT_B64=$(aws ssm get-parameter --name "/pocketflow/production/firebase_service_account_b64" --with-decryption --query "Parameter.Value" --output text || echo "")
AWS_ACCESS_KEY_ID_VAL=$(aws ssm get-parameter --name "/pocketflow/production/aws_access_key_id" --with-decryption --query "Parameter.Value" --output text || echo "")
AWS_SECRET_ACCESS_KEY_VAL=$(aws ssm get-parameter --name "/pocketflow/production/aws_secret_access_key" --with-decryption --query "Parameter.Value" --output text || echo "")
GEMINI_API_KEY_VAL=$(aws ssm get-parameter --name "/pocketflow/production/gemini_api_key" --with-decryption --query "Parameter.Value" --output text || echo "")

# Write the .env file
cat << ENVFILE > .env
FIREBASE_SERVICE_ACCOUNT_B64=${FIREBASE_SERVICE_ACCOUNT_B64}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID_VAL}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY_VAL}
AWS_DEFAULT_REGION=us-east-1
GEMINI_API_KEY=${GEMINI_API_KEY_VAL}
ENVFILE

chmod 600 .env
chown ubuntu:ubuntu .env

##############################################
# Log in to ECR and start the application
##############################################
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 831959027398.dkr.ecr.us-east-1.amazonaws.com

echo "Starting Docker Compose stack..."
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Change ownership of the directories
chown -R ubuntu:ubuntu /home/ubuntu/PocketFlow

##############################################
# Configure & Start CloudWatch Agent
##############################################
mkdir -p /opt/aws/amazon-cloudwatch-agent/etc

cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "namespace": "PocketFlow/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60,
        "totalcpu": true
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "read_bytes",
          "write_bytes",
          "reads",
          "writes"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      },
      "net": {
        "measurement": [
          "bytes_sent",
          "bytes_recv",
          "packets_sent",
          "packets_recv"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/*/*-json.log",
            "log_group_name": "/pocketflow/production/docker",
            "log_stream_name": "{instance_id}/docker",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s

systemctl enable amazon-cloudwatch-agent

echo "=========================================="
echo "PocketFlow ASG Bootstrap Complete"
echo "=========================================="
