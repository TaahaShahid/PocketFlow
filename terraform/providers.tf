provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "PocketFlow"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}