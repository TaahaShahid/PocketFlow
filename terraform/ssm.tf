resource "aws_ssm_parameter" "firebase_service_account_b64" {
  name        = "/pocketflow/production/firebase_service_account_b64"
  description = "Firebase Service Account Base64 encoded JSON"
  type        = "SecureString"
  value       = "placeholder-replace-me"

  lifecycle {
    ignore_changes = [value]
  }

  tags = local.common_tags
}

resource "aws_ssm_parameter" "aws_access_key_id" {
  name        = "/pocketflow/production/aws_access_key_id"
  description = "AWS Access Key ID for application ECR/S3 access"
  type        = "SecureString"
  value       = "placeholder-replace-me"

  lifecycle {
    ignore_changes = [value]
  }

  tags = local.common_tags
}

resource "aws_ssm_parameter" "aws_secret_access_key" {
  name        = "/pocketflow/production/aws_secret_access_key"
  description = "AWS Secret Access Key for application ECR/S3 access"
  type        = "SecureString"
  value       = "placeholder-replace-me"

  lifecycle {
    ignore_changes = [value]
  }

  tags = local.common_tags
}
