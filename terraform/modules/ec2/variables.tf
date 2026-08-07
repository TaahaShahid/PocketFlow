variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}

variable "public_subnet_id" {
  description = "Public subnet ID"
  type        = string
}

variable "security_group_id" {
  description = "Security Group ID"
  type        = string
}

variable "instance_profile_name" {
  description = "IAM Instance Profile"
  type        = string
}

variable "key_name" {
  description = "Existing EC2 Key Pair"
  type        = string
}

variable "instance_type" {
  description = "EC2 Instance Type"
  type        = string

  default = "t3.small"
}