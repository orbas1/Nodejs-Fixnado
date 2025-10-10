provider "aws" {
  region              = var.aws_region
  allowed_account_ids = var.allowed_account_ids
  default_tags = merge(var.default_tags, {
    "Environment" = var.environment
  })
}
