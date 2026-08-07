output "instance_id" {
  value = aws_instance.backend.id
}

output "private_ip" {
  value = aws_instance.backend.private_ip
}

output "public_ip" {
  value = aws_eip.backend.public_ip
}

output "public_dns" {
  value = aws_instance.backend.public_dns
}