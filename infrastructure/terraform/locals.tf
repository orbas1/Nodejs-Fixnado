locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(var.default_tags, {
    "Project"     = var.project,
    "Environment" = var.environment
  })
}
