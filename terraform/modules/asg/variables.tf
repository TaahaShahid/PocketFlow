variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "vpc_id" {
  description = "Target VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of subnet IDs for placing the ASG instances"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security Group ID of the EC2 instances"
  type        = string
}

variable "instance_profile_name" {
  description = "IAM Instance Profile Name to attach to instances"
  type        = string
}

variable "target_group_arns" {
  description = "List of target group ARNs to register the instances with"
  type        = list(string)
}

variable "key_name" {
  description = "Key pair name for EC2 instances"
  type        = string
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
}

variable "pocketflow_enabled" {
  description = "Flag to enable/disable compute capacity"
  type        = bool
}
