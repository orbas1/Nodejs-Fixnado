output "vpc_id" {
  value = module.vpc.vpc_id
}

output "alb_dns_name" {
  value = aws_lb.app.dns_name
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "db_endpoint" {
  value = aws_db_instance.this.address
}

output "secrets_manager_app_config_arn" {
  value = aws_secretsmanager_secret.app_config.arn
}

output "secrets_manager_feature_toggles_arn" {
  value = aws_secretsmanager_secret.feature_toggles.arn
}

output "alb_blue_target_group_arn" {
  value = aws_lb_target_group.app_blue.arn
}

output "alb_green_target_group_arn" {
  value = aws_lb_target_group.app_green.arn
}

output "codedeploy_application_name" {
  value = aws_codedeploy_app.ecs.name
}

output "codedeploy_deployment_group_name" {
  value = aws_codedeploy_deployment_group.ecs.deployment_group_name
}

output "alb_validation_listener_arn" {
  value = aws_lb_listener.validation.arn
}
