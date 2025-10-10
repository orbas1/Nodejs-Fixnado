resource "aws_db_subnet_group" "this" {
  name       = "${local.name_prefix}-db"
  subnet_ids = module.vpc.database_subnets
  tags       = local.common_tags
}

resource "aws_db_parameter_group" "mysql" {
  name   = "${local.name_prefix}-mysql"
  family = "mysql8.0"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  tags = local.common_tags
}

resource "aws_db_instance" "this" {
  identifier = "${local.name_prefix}-mysql"

  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t4g.medium"
  allocated_storage    = 50
  max_allocated_storage = 200
  storage_encrypted    = true
  kms_key_id           = aws_kms_key.database.arn
  multi_az             = true

  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [aws_security_group.database.id]
  publicly_accessible     = false
  backup_retention_period = 7
  auto_minor_version_upgrade = true
  deletion_protection     = true
  maintenance_window      = "Sun:02:00-Sun:03:00"
  backup_window           = "01:00-02:00"

  username = var.db_username
  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  performance_insights_enabled = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

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
