resource "random_id" "alb_logs" {
  byte_length = 4
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.name_prefix}-alb-logs-${random_id.alb_logs.hex}"

  lifecycle_rule {
    id      = "glacier-archive"
    enabled = true

    transition {
      days          = 30
      storage_class = "GLACIER_IR"
    }

    expiration {
      days = 365
    }
  }

  force_destroy = false

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}
