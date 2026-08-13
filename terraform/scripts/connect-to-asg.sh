#!/bin/bash
set -euo pipefail

# PocketFlow ASG SSM Connection Tool

# 1. Verify dependencies
if ! command -v aws &> /dev/null; then
    echo "Error: aws CLI is not installed or not in PATH." >&2
    exit 1
fi

if ! command -v session-manager-plugin &> /dev/null; then
    echo "Error: AWS Session Manager Plugin is not installed." >&2
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "Error: terraform CLI is not installed or not in PATH." >&2
    exit 1
fi

# Determine script directory to run terraform relative to script location if needed
# But default to using -chdir=terraform assuming execution from project root
TERRAFORM_DIR="terraform"
if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: '$TERRAFORM_DIR' directory not found. Please run this script from the project root." >&2
    exit 1
fi

# 2. Get ASG name dynamically from Terraform
ASG_NAME=$(terraform -chdir="$TERRAFORM_DIR" output -raw asg_name 2>/dev/null || echo "")

if [ -z "$ASG_NAME" ] || [ "$ASG_NAME" = "null" ]; then
    echo "Error: Failed to retrieve 'asg_name' output from Terraform." >&2
    exit 1
fi

# 3. Query the ASG and check for InService/Healthy instances
# We use the native aws CLI --query filter to retrieve only healthy and in-service instances
HEALTHY_INSTANCES=$(aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names "$ASG_NAME" \
    --query "AutoScalingGroups[0].Instances[?LifecycleState=='InService' && HealthStatus=='Healthy'].InstanceId" \
    --output text 2>/dev/null || echo "")

if [ -z "$HEALTHY_INSTANCES" ] || [ "$HEALTHY_INSTANCES" = "None" ]; then
    echo "Error: No InService and Healthy instances found in ASG '$ASG_NAME'." >&2
    exit 1
fi

# 4. Filter healthy instances to find one that is Online in Systems Manager (SSM)
SELECTED_INSTANCE_ID=""
for INSTANCE_ID in $HEALTHY_INSTANCES; do
    PING_STATUS=$(aws ssm describe-instance-information \
        --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
        --query "InstanceInformationList[0].PingStatus" \
        --output text 2>/dev/null || echo "")
    
    if [ "$PING_STATUS" = "Online" ]; then
        SELECTED_INSTANCE_ID="$INSTANCE_ID"
        break
    fi
done

if [ -z "$SELECTED_INSTANCE_ID" ]; then
    echo "Error: None of the healthy ASG instances are online in Systems Manager." >&2
    exit 1
fi

# 5. Print connection details
echo "PocketFlow Production ASG SSM Connection"
echo "-----------------------------------------"
echo "ASG: $ASG_NAME"
echo "Selected instance: $SELECTED_INSTANCE_ID"
echo "SSM status: Online"
echo "Starting Session Manager..."

# 6. Start the session
aws ssm start-session --target "$SELECTED_INSTANCE_ID"
