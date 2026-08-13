variable "project_name" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "public_subnet_cidr" {
  type = string
}

variable "availability_zone" {
  type = string
}

variable "public_subnet_2_cidr" {
  type = string
}

variable "availability_zone_2" {
  type = string
}

variable "common_tags" {
  type = map(string)
}