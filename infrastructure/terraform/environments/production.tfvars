environment             = "production"
aws_region              = "eu-west-2"
allowed_account_ids     = ["123456789012"]
project                 = "fixnado"
vpc_cidr                = "10.20.0.0/16"
public_subnet_cidrs     = ["10.20.0.0/24", "10.20.1.0/24", "10.20.2.0/24"]
private_subnet_cidrs    = ["10.20.10.0/24", "10.20.11.0/24", "10.20.12.0/24"]
database_subnet_cidrs   = ["10.20.20.0/24", "10.20.21.0/24", "10.20.22.0/24"]
availability_zones      = ["eu-west-2a", "eu-west-2b", "eu-west-2c"]
domain_name             = "app.fixnado.com"
certificate_arn         = "arn:aws:acm:eu-west-2:123456789012:certificate/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
container_image         = "123456789012.dkr.ecr.eu-west-2.amazonaws.com/fixnado/backend:production"
container_port          = 3000
test_listener_port      = 9443
desired_count           = 3
min_capacity            = 3
max_capacity            = 9
db_username             = "fixnado_app"
db_password_secret_name = "fixnado/production/database"
log_retention_in_days   = 30
alarm_email             = "noc@fixnado.com"
blue_green_validation_cidrs = [
  "51.140.120.0/24",
  "51.140.121.0/24"
]
