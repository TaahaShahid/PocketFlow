#!/bin/bash
set -euo pipefail

# PocketFlow Production Turn OFF Utility

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." &>/dev/null && pwd)"
TERRAFORM_DIR="$REPO_ROOT/terraform"

echo "PocketFlow Production OFF Controller"
echo "========================================="

# 1. Verify AWS credentials and show current identity
echo "Checking AWS caller identity..."
aws sts get-caller-identity --query "[Arn,Account]" --output table || {
    echo "Error: Failed to authenticate with AWS. Ensure you have valid AWS credentials loaded." >&2
    exit 1
}

# 2. Discover ASG Name
echo "Discovering ASG name..."
ASG_NAME=$(aws autoscaling describe-auto-scaling-groups \
    --query "AutoScalingGroups[?starts_with(AutoScalingGroupName, 'pocketflow-production-asg-')].AutoScalingGroupName" \
    --output text 2>/dev/null | awk '{print $1}' || echo "")

if [ -z "$ASG_NAME" ] || [ "$ASG_NAME" = "None" ] || [ "$ASG_NAME" = "" ]; then
    echo "ASG name not found via prefix search. Attempting Terraform output..."
    ASG_NAME=$(terraform -chdir="$TERRAFORM_DIR" output -raw asg_name 2>/dev/null || echo "")
fi

if [ -z "$ASG_NAME" ] || [ "$ASG_NAME" = "null" ] || [ "$ASG_NAME" = "" ]; then
    echo "Error: Failed to discover active ASG name." >&2
    exit 1
fi
echo "Active ASG: $ASG_NAME"

# 3. Show current ASG capacity & instances
echo "Current Auto Scaling Group Instances:"
aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names "$ASG_NAME" \
    --query "AutoScalingGroups[0].Instances[*].[InstanceId,LifecycleState,HealthStatus]" \
    --output table || echo "No instances currently tracked."

# 4. Ask for explicit confirmation
read -p "Are you sure you want to turn PocketFlow OFF? This will terminate all compute instances. (y/N) " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY]$ ]]; then
    echo "Off operation cancelled."
    exit 0
fi

# 5. Execute capacity change via Terraform
echo "Scaling down compute capacity to 0 via Terraform..."
terraform -chdir="$TERRAFORM_DIR" apply -var="pocketflow_enabled=false" -auto-approve

# 6. Wait until instance count is 0
echo "Waiting for instances to terminate..."
while true; do
    INSTANCES=$(aws autoscaling describe-auto-scaling-groups \
        --auto-scaling-group-names "$ASG_NAME" \
        --query "AutoScalingGroups[0].Instances[*].[InstanceId,LifecycleState]" \
        --output text 2>/dev/null || echo "")
    
    # Filter out terminated/terminating instances to see if any are left
    COUNT=$(echo "$INSTANCES" | grep -v -E "Terminating|Terminated|^$" | wc -l | tr -d ' ' || true)
    
    if [ "$COUNT" -eq 0 ]; then
        echo "Success: All instances have been terminated cleanly."
        break
    fi
    echo "Waiting... ($COUNT instances still active or shutting down). Retrying in 10 seconds..."
    sleep 10
done

echo "========================================="
echo "PocketFlow Production is now OFF!"
echo "========================================="
