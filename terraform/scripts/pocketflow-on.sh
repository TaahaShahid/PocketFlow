#!/bin/bash
set -euo pipefail

# PocketFlow Production Turn ON Utility

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." &>/dev/null && pwd)"
TERRAFORM_DIR="$REPO_ROOT/terraform"

echo "PocketFlow Production ON Controller"
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

# 3. Ask for explicit confirmation
read -p "Are you sure you want to turn PocketFlow ON? This will launch a new compute instance. (y/N) " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY]$ ]]; then
    echo "On operation cancelled."
    exit 0
fi

# 4. Execute capacity change via Terraform
echo "Scaling up compute capacity to 1 via Terraform..."
terraform -chdir="$TERRAFORM_DIR" apply -var="pocketflow_enabled=true" -auto-approve

# 5. Wait for new instance launch
echo "Waiting for ASG to launch a new instance..."
INSTANCE_ID=""
for check in {1..30}; do
    INSTANCE_ID=$(aws autoscaling describe-auto-scaling-groups \
        --auto-scaling-group-names "$ASG_NAME" \
        --query "AutoScalingGroups[0].Instances[?LifecycleState!='Terminating' && LifecycleState!='Terminated'].InstanceId" \
        --output text 2>/dev/null | awk '{print $1}' || echo "")
    
    if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ] && [ "$INSTANCE_ID" != "" ]; then
        echo "New instance detected: $INSTANCE_ID"
        break
    fi
    sleep 5
done

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ] || [ "$INSTANCE_ID" = "" ]; then
    echo "Error: ASG failed to register a new instance within 2.5 minutes." >&2
    exit 1
fi

# 6. Wait for Systems Manager (SSM) Online Registration
echo "Waiting for instance $INSTANCE_ID to become Online in Systems Manager..."
ONLINE=false
for check in {1..30}; do
    STATUS=$(aws ssm describe-instance-information \
        --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
        --query "InstanceInformationList[0].PingStatus" \
        --output text 2>/dev/null || echo "")
    
    if [ "$STATUS" = "Online" ]; then
        echo "Instance is now SSM Online!"
        ONLINE=true
        break
    fi
    sleep 10
done

if [ "$ONLINE" != "true" ]; then
    echo "Error: Instance $INSTANCE_ID failed to register as Online in Systems Manager within 5 minutes." >&2
    echo "Use this CLI command to check its EC2 state:" >&2
    echo "  aws ec2 describe-instances --instance-ids $INSTANCE_ID --query \"Reservations[0].Instances[0].State.Name\"" >&2
    exit 1
fi

# 7. Discover Target Group ARN
echo "Discovering Target Group ARN..."
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --query "TargetGroups[?starts_with(TargetGroupName, 'pocketflow-production-tg')].TargetGroupArn" \
    --output text 2>/dev/null | awk '{print $1}' || echo "")

if [ -z "$TARGET_GROUP_ARN" ] || [ "$TARGET_GROUP_ARN" = "None" ] || [ "$TARGET_GROUP_ARN" = "" ]; then
    TARGET_GROUP_ARN=$(terraform -chdir="$TERRAFORM_DIR" output -raw target_group_arn 2>/dev/null || echo "")
fi

if [ -z "$TARGET_GROUP_ARN" ] || [ "$TARGET_GROUP_ARN" = "null" ] || [ "$TARGET_GROUP_ARN" = "" ]; then
    echo "Error: Failed to discover target group ARN." >&2
    exit 1
fi

# 8. Wait for target to pass ALB health checks
echo "Waiting for target $INSTANCE_ID to pass ALB health checks (this includes docker bootstrap)..."
HEALTHY=false
for check in {1..30}; do
    STATE=$(aws elbv2 describe-target-health \
        --target-group-arn "$TARGET_GROUP_ARN" \
        --query "TargetHealthDescriptions[?Target.Id=='$INSTANCE_ID'].TargetHealth.State" \
        --output text 2>/dev/null || echo "unknown")
    
    echo "Target health state: '$STATE' (check $check/30)"
    if [ "$STATE" = "healthy" ]; then
        HEALTHY=true
        break
    fi
    
    # Check for failure reasons to provide logs/clues
    REASON=$(aws elbv2 describe-target-health \
        --target-group-arn "$TARGET_GROUP_ARN" \
        --query "TargetHealthDescriptions[?Target.Id=='$INSTANCE_ID'].TargetHealth.Reason" \
        --output text 2>/dev/null || echo "")
    if [ -n "$REASON" ] && [ "$REASON" != "None" ] && [ "$REASON" != "" ]; then
        echo "  (ALB Diagnostic: $REASON)"
    fi
    
    sleep 10
done

if [ "$HEALTHY" != "true" ]; then
    echo "Error: Instance $INSTANCE_ID failed ALB health checks." >&2
    echo "Use the following diagnostics steps:" >&2
    echo "1. Connect to the instance using the connection script:" >&2
    echo "   ./terraform/scripts/connect-to-asg.sh" >&2
    echo "2. Check the user-data bootstrap output:" >&2
    echo "   cat /var/log/user-data.log" >&2
    echo "3. Verify Docker container logs:" >&2
    echo "   docker ps" >&2
    echo "   docker logs pocketflow-backend" >&2
    exit 1
fi

echo "========================================="
echo "PocketFlow Production is now ON!"
echo "ALB Endpoint: http://$(terraform -chdir="$TERRAFORM_DIR" output -raw alb_dns_name)"
echo "========================================="
