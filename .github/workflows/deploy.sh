#!/bin/bash
set -euo pipefail

# PocketFlow ASG SSM Deployment Helper

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="831959027398"
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# 1. Determine ASG name dynamically
echo "Discovering ASG name..."
ASG_NAME=$(aws autoscaling describe-auto-scaling-groups \
    --query "AutoScalingGroups[?starts_with(AutoScalingGroupName, 'pocketflow-production-asg-')].AutoScalingGroupName" \
    --output text 2>/dev/null | awk '{print $1}' || echo "")

if [ -z "$ASG_NAME" ] || [ "$ASG_NAME" = "None" ] || [ "$ASG_NAME" = "" ]; then
    echo "ASG name not found via prefix search. Attempting Terraform output..."
    ASG_NAME=$(terraform -chdir=terraform output -raw asg_name 2>/dev/null || echo "")
fi

if [ -z "$ASG_NAME" ] || [ "$ASG_NAME" = "null" ] || [ "$ASG_NAME" = "" ]; then
    echo "Error: Failed to discover ASG name." >&2
    exit 1
fi
echo "ASG Name: $ASG_NAME"

# 2. Discover all InService and Healthy instances in ASG
echo "Discovering healthy ASG instances..."
INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names "$ASG_NAME" \
    --query "AutoScalingGroups[0].Instances[?LifecycleState=='InService' && HealthStatus=='Healthy'].InstanceId" \
    --output text 2>/dev/null || echo "")

if [ -z "$INSTANCE_IDS" ] || [ "$INSTANCE_IDS" = "None" ] || [ "$INSTANCE_IDS" = "" ]; then
    echo "Error: No healthy InService instances found in ASG '$ASG_NAME'." >&2
    exit 1
fi

echo "Found instances: $INSTANCE_IDS"

# 3. Verify Systems Manager (SSM) Online Status
for INSTANCE_ID in $INSTANCE_IDS; do
    echo "Verifying SSM status for $INSTANCE_ID..."
    PING_STATUS=$(aws ssm describe-instance-information \
        --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
        --query "InstanceInformationList[0].PingStatus" \
        --output text 2>/dev/null || echo "")
    
    if [ "$PING_STATUS" != "Online" ]; then
        echo "Error: Instance $INSTANCE_ID is not online in Systems Manager (PingStatus: '$PING_STATUS')." >&2
        exit 1
    fi
    echo "Instance $INSTANCE_ID is SSM Online."
done

# 4. Get target group ARN for health checks
echo "Discovering Target Group ARN..."
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
    --query "TargetGroups[?starts_with(TargetGroupName, 'pocketflow-production-tg')].TargetGroupArn" \
    --output text 2>/dev/null | awk '{print $1}' || echo "")

if [ -z "$TARGET_GROUP_ARN" ] || [ "$TARGET_GROUP_ARN" = "None" ] || [ "$TARGET_GROUP_ARN" = "" ]; then
    echo "Target Group ARN not found via prefix search. Attempting Terraform output..."
    TARGET_GROUP_ARN=$(terraform -chdir=terraform output -raw target_group_arn 2>/dev/null || echo "")
fi

if [ -z "$TARGET_GROUP_ARN" ] || [ "$TARGET_GROUP_ARN" = "null" ] || [ "$TARGET_GROUP_ARN" = "" ]; then
    echo "Error: Failed to discover target group ARN." >&2
    exit 1
fi
echo "Target Group ARN: $TARGET_GROUP_ARN"

# 5. Rolling deployment over all instances
for INSTANCE_ID in $INSTANCE_IDS; do
    echo "=================================================="
    echo "Starting deployment on instance: $INSTANCE_ID"
    echo "=================================================="

    # Send SSM Run Command to deploy backend
    # This logs into ECR using the instance profile, pulls the latest image, recreates containers, and prunes old images.
    COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Deploying backend to PocketFlow ASG instance $INSTANCE_ID" \
    --parameters commands='[
        "set -eux",
        "cd /home/ubuntu/PocketFlow",
        "aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 831959027398.dkr.ecr.us-east-1.amazonaws.com",
        "docker compose -f docker-compose.prod.yml pull",
        "docker compose -f docker-compose.prod.yml up -d --force-recreate",
        "docker image prune -f"
    ]' \
    --query "Command.CommandId" \
    --output text)

    echo "SSM Command sent. Command ID: $COMMAND_ID"
    echo "Waiting for command execution to complete on $INSTANCE_ID..."

    aws ssm wait command-executed \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID"

    # Verify execution outcome
    STATUS=$(aws ssm list-command-invocations \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --details \
        --query "CommandInvocations[0].Status" \
        --output text)

    if [ "$STATUS" != "Success" ]; then
        echo "Error: SSM Deployment failed on instance $INSTANCE_ID (Status: $STATUS)." >&2
        echo "Fetch logs for Command ID $COMMAND_ID for more details." >&2
        exit 1
    fi
    echo "SSM Command execution completed successfully on $INSTANCE_ID."

    # 6. Wait for target to become healthy in ALB Target Group before proceeding to next instance
    echo "Waiting for target $INSTANCE_ID to become healthy in the ALB target group..."
    HEALTHY=false
    # Poll for up to 5 minutes (30 checks of 10s sleep)
    for check in {1..30}; do
        STATE=$(aws elbv2 describe-target-health \
            --target-group-arn "$TARGET_GROUP_ARN" \
            --query "TargetHealthDescriptions[?Target.Id=='$INSTANCE_ID'].TargetHealth.State" \
            --output text 2>/dev/null || echo "unknown")

        echo "Target $INSTANCE_ID health state: '$STATE' (check $check/30)"
        if [ "$STATE" = "healthy" ]; then
            HEALTHY=true
            break
        fi
        sleep 10
    done

    if [ "$HEALTHY" != "true" ]; then
        echo "Error: Instance $INSTANCE_ID did not become healthy in the ALB target group after deployment." >&2
        exit 1
    fi
    echo "Instance $INSTANCE_ID is successfully healthy in ALB Target Group."
done

echo "=================================================="
echo "Rolling deployment completed successfully!"
echo "=================================================="
