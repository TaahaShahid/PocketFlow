variable "project_name" {
  description = "Name of the project used for resource naming prefixes"
  type        = string
}

variable "vpc_id" {
  description = "ID of the target VPC"
  type        = string
}

variable "public_subnets" {
  description = "List of public subnet IDs to place the ALB in"
  type        = list(string)
}

variable "target_instance_id" {
  description = "Instance ID of the existing EC2 backend server"
  type        = string
  default     = ""
}

variable "ec2_security_group_id" {
  description = "Security Group ID of the existing EC2 backend to append the ingress rule"
  type        = string
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
}
