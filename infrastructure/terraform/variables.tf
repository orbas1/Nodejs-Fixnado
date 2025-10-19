variable "project" {
  description = "Project slug for tagging"
  type        = string
  default     = "fixnado"
}

variable "environment" {
  description = "Deployment environment (staging|production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "allowed_account_ids" {
  description = "Optional list of AWS account IDs permitted to deploy"
  type        = list(string)
  default     = []
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
}

variable "database_subnet_cidrs" {
  description = "Database subnet CIDR blocks"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability zones used across subnets"
  type        = list(string)
}

variable "domain_name" {
  description = "Primary DNS domain"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate for HTTPS listeners"
  type        = string
}

variable "container_image" {
  description = "Container image URI for the backend service"
  type        = string
}

variable "container_port" {
  description = "Container port exposed by the backend service"
  type        = number
  default     = 3000
}

variable "test_listener_port" {
  description = "Port used by the validation listener that receives traffic during CodeDeploy blue/green bake times"
  type        = number
  default     = 9443
}

variable "desired_count" {
  description = "Number of ECS tasks to run"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum capacity for autoscaling"
  type        = number
  default     = 6
}

variable "min_capacity" {
  description = "Minimum capacity for autoscaling"
  type        = number
  default     = 2
}

variable "db_username" {
  description = "Database master username"
  type        = string
}

variable "db_password_secret_name" {
  description = "Secrets Manager secret containing the database password"
  type        = string
}

variable "default_tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default = {
    "Owner"       = "Fixnado Platform"
    "ManagedBy"   = "Terraform"
    "CostCenter"  = "engineering"
    "Compliance"  = "gdpr"
  }
}

variable "log_retention_in_days" {
  description = "Retention in days for application logs"
  type        = number
  default     = 30
}

variable "alarm_email" {
  description = "Email address subscribed to critical CloudWatch alarms"
  type        = string
}

variable "blue_green_validation_cidrs" {
  description = "CIDR blocks permitted to access the validation listener during blue/green deployments"
  type        = list(string)
  default     = []
}
