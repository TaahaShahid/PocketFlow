output "alb_name" {
  description = "The name of the load balancer"
  value       = aws_lb.this.name
}

output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.this.dns_name
}

output "target_group_arn" {
  description = "The ARN of the Target Group"
  value       = aws_lb_target_group.this.arn
}

output "alb_security_group_id" {
  description = "The ID of the ALB security group"
  value       = aws_security_group.alb.id
}
