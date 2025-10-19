resource "aws_sns_topic" "alarms" {
  name = "${local.name_prefix}-alarms"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "high_5xx" {
  alarm_name          = "${local.name_prefix}-high-5xx"
  alarm_description   = "ALB returning elevated 5xx rates"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${local.name_prefix}-ecs-cpu"
  alarm_description   = "ECS service CPU above threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    ClusterName = aws_ecs_cluster.this.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "codedeploy_failure" {
  alarm_name          = "${local.name_prefix}-codedeploy-failures"
  alarm_description   = "CodeDeploy deployment failures detected"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Failed"
  namespace           = "AWS/CodeDeploy"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    DeploymentGroupName = aws_codedeploy_deployment_group.ecs.deployment_group_name
    ApplicationName     = aws_codedeploy_app.ecs.name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
  tags          = local.common_tags
}
