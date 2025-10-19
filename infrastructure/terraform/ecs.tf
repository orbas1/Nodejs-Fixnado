resource "aws_ecs_cluster" "this" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ecs/${local.name_prefix}-app"
  retention_in_days = var.log_retention_in_days
  tags              = local.common_tags
}

resource "aws_lb" "app" {
  name               = substr("${local.name_prefix}-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = local.common_tags
}

resource "aws_lb_target_group" "app_blue" {
  name        = substr("${local.name_prefix}-tg", 0, 32)
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id

  health_check {
    matcher             = "200-399"
    interval            = 30
    path                = "/health/ready"
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 5
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_blue.arn
  }
}

resource "aws_lb_target_group" "app_green" {
  name        = substr("${local.name_prefix}-tg-green", 0, 32)
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id

  health_check {
    matcher             = "200-399"
    interval            = 30
    path                = "/health/ready"
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 5
  }

  tags = merge(local.common_tags, { "Deployment" = "green" })
}

resource "aws_lb_listener" "validation" {
  load_balancer_arn = aws_lb.app.arn
  port              = var.test_listener_port
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_green.arn
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "${local.name_prefix}-task-execution"
  assume_role_policy = data.aws_iam_policy_document.task_execution_assume.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "task_execution_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "secrets_access" {
  name        = "${local.name_prefix}-secrets"
  description = "Allow ECS tasks to read runtime secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"],
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.project}/*",
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.environment}/*",
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.db_password_secret_name}*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secrets" {
  role       = aws_iam_role.task_execution.name
  policy_arn = aws_iam_policy.secrets_access.arn
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${local.name_prefix}-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "SECRET_MANAGER_PREFIX"
          value = "${var.project}/${var.environment}"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health/live || exit 1"]
        interval    = 30
        retries     = 3
        timeout     = 5
        startPeriod = 10
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_service" "app" {
  name            = "${local.name_prefix}-app"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count

  deployment_controller {
    type = "CODE_DEPLOY"
  }

  health_check_grace_period_seconds = 60

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  launch_type = "FARGATE"

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.service.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_blue.arn
    container_name   = "backend"
    container_port   = var.container_port
  }

  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_lb_listener.https, aws_lb_listener.validation]

  tags = local.common_tags
}

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name_prefix}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 55
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

resource "aws_iam_role" "codedeploy" {
  name               = "${local.name_prefix}-codedeploy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "codedeploy" {
  role       = aws_iam_role.codedeploy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForECS"
}

resource "aws_codedeploy_app" "ecs" {
  name             = "${local.name_prefix}-ecs"
  compute_platform = "ECS"
}

resource "aws_codedeploy_deployment_group" "ecs" {
  app_name              = aws_codedeploy_app.ecs.name
  deployment_group_name = "${local.name_prefix}-ecs"
  service_role_arn      = aws_iam_role.codedeploy.arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"

  ecs_service {
    cluster_name = aws_ecs_cluster.this.name
    service_name = aws_ecs_service.app.name
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout    = "STOP_DEPLOYMENT"
      wait_time_in_minutes = 20
    }

    terminate_blue_instances_on_deployment_success {
      action = "TERMINATE"
      termination_wait_time_in_minutes = 10
    }

    green_fleet_provisioning_option {
      action = "DISCOVER_EXISTING"
    }
  }

  load_balancer_info {
    target_group_pair_info {
      prod_target_group {
        target_group_arn = aws_lb_target_group.app_blue.arn
      }

      test_target_group {
        target_group_arn = aws_lb_target_group.app_green.arn
      }

      prod_traffic_route {
        listener_arns = [aws_lb_listener.https.arn]
      }

      test_traffic_route {
        listener_arns = [aws_lb_listener.validation.arn]
      }
    }
  }

  alarm_configuration {
    enabled = true
    alarms  = [
      aws_cloudwatch_metric_alarm.high_5xx.alarm_name,
      aws_cloudwatch_metric_alarm.ecs_cpu.alarm_name
    ]
  }

  auto_rollback_configuration {
    enabled = true
    events  = [
      "DEPLOYMENT_FAILURE",
      "DEPLOYMENT_STOP_ON_ALARM"
    ]
  }

  depends_on = [aws_lb_listener.validation]
}
