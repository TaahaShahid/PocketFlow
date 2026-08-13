variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "project_name" {
  default = "pocketflow"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  default = "10.0.1.0/24"
}

variable "public_subnet_2_cidr" {
  default = "10.0.2.0/24"
}

variable "key_name" {
  description = "Existing EC2 Key Pair"
  type        = string
}

variable "pocketflow_enabled" {
  description = "Enable or disable the PocketFlow production compute layer (ASG)"
  type        = bool
  default     = true
}