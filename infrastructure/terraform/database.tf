resource "aws_db_subnet_group" "this" {
  name       = "${local.name_prefix}-db"
  subnet_ids = module.vpc.database_subnets
  tags       = local.common_tags
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${local.name_prefix}-postgres"
  family = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "max_connections"
    value = "500"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name         = "pg_stat_statements.track"
    value        = "ALL"
    apply_method = "pending-reboot"
  }

  tags = local.common_tags
}

resource "aws_db_instance" "this" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "15.5"
  instance_class = "db.t4g.medium"

  allocated_storage      = 100
  max_allocated_storage  = 400
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.database.arn
  multi_az               = true
  port                   = 5432
  iam_database_authentication_enabled = true

  db_subnet_group_name    = aws_db_subnet_group.this.name
  db_parameter_group_name = aws_db_parameter_group.postgres.name
  vpc_security_group_ids  = [aws_security_group.database.id]
  publicly_accessible     = false
  backup_retention_period = var.environment == "production" ? 14 : 7
  auto_minor_version_upgrade = true
  deletion_protection        = true
  maintenance_window         = "Sun:02:00-Sun:03:00"
  backup_window              = "01:00-02:00"

  username = var.db_username
  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  apply_immediately = false

  tags = local.common_tags
}

data "aws_secretsmanager_secret" "db_password" {
  name = var.db_password_secret_name
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = data.aws_secretsmanager_secret.db_password.id
}

resource "aws_kms_key" "database" {
  description             = "KMS key for ${local.name_prefix} database"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "database" {
  name          = "alias/${local.name_prefix}-database"
  target_key_id = aws_kms_key.database.id
}
