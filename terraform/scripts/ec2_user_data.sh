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
    lsb-release

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

unzip awscliv2.zip

./aws/install

##############################################
# Docker Permissions
##############################################

usermod -aG docker ubuntu

##############################################
# Create Project Directory
##############################################

mkdir -p /home/ubuntu/PocketFlow

chown -R ubuntu:ubuntu /home/ubuntu/PocketFlow