# output "ec2_public_ip" {
#   value = module.ec2.public_ip
# }

output "alb_name" {
  value = module.alb.alb_name
}

output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "backend_ecr_repository" {
  value = module.ecr.repository_url
}

output "vpc_id" {
  value = module.networking.vpc_id
}

output "target_group_arn" {
  description = "ARN of the PocketFlow ALB target group"
  value       = module.alb.target_group_arn
}

output "asg_name" {
  value = module.asg.asg_name
}

output "launch_template_id" {
  value = module.asg.launch_template_id
}

output "launch_template_version" {
  value = module.asg.launch_template_latest_version
}