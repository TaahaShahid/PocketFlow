variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "common_tags" {
  description = "Common tags"
  type        = map(string)
}