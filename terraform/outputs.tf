output "ec2_public_ip" {
  value = module.ec2.public_ip
}

output "backend_ecr_repository" {
  value = module.ecr.repository_url
}

output "vpc_id" {
  value = module.networking.vpc_id
}