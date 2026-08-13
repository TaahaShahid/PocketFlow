#!/bin/bash
set -eux

##############################################
# Update Ubuntu
##############################################

apt-get update -y
apt-get upgrade -y

##############################################
# Install Packages
##############################################

apt-get install -y \
    ca-certificates \
    curl \
    unzip \
    git \
    gnupg \
    lsb-release \
    wget

##############################################
# Install Docker
##############################################

install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

chmod a+r /etc/apt/keyrings/docker.gpg

echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update

apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

systemctl enable docker
systemctl start docker

##############################################
# Install AWS CLI
##############################################

cd /tmp

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
    -o awscliv2.zip

unzip -o awscliv2.zip

./aws/install

##############################################
# Install CloudWatch Agent
##############################################

cd /tmp

wget \
    https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb \
    -O amazon-cloudwatch-agent.deb

dpkg -i -E amazon-cloudwatch-agent.deb

##############################################
# Configure CloudWatch Agent
##############################################

mkdir -p /opt/aws/amazon-cloudwatch-agent/etc

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOF'
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

##############################################
# Start CloudWatch Agent
##############################################

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

systemctl enable amazon-cloudwatch-agent

##############################################
# Docker Permissions
##############################################

usermod -aG docker ubuntu

##############################################
# Create Project Directory
##############################################

mkdir -p /home/ubuntu/PocketFlow

chown -R ubuntu:ubuntu /home/ubuntu/PocketFlow