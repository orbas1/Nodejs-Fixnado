data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

resource "aws_secretsmanager_secret" "app_config" {
  name        = "${var.project}/${var.environment}/app-config"
  description = "Runtime configuration for Fixnado ${var.environment}"
  kms_key_id  = aws_kms_key.runtime.arn
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id     = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    JWT_SECRET            = "rotate-me"
    ENCRYPTION_KEY        = "rotate-me"
    AWS_SES_SENDER        = "security@${var.domain_name}"
    MFA_ISSUER            = "Fixnado"
    TOKEN_ROTATION_DAYS   = 7
  })
}

resource "aws_kms_key" "runtime" {
  description             = "KMS key for ${local.name_prefix} runtime secrets"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "runtime" {
  name          = "alias/${local.name_prefix}-runtime"
  target_key_id = aws_kms_key.runtime.id
}
