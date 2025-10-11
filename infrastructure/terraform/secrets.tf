data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  feature_toggle_seed = jsondecode(file("${path.module}/runtime-config/feature_toggles/${var.environment}.json"))
}

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
    FEATURE_TOGGLE_SECRET_ARN = aws_secretsmanager_secret.feature_toggles.arn
  })
}

resource "aws_secretsmanager_secret" "feature_toggles" {
  name        = "${var.project}/${var.environment}/feature-toggles"
  description = "Feature flag configuration for Fixnado ${var.environment}"
  kms_key_id  = aws_kms_key.runtime.arn
  tags        = merge(local.common_tags, { "Purpose" = "feature-toggles" })
}

resource "aws_secretsmanager_secret_version" "feature_toggles" {
  secret_id     = aws_secretsmanager_secret.feature_toggles.id
  secret_string = jsonencode(local.feature_toggle_seed)
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
