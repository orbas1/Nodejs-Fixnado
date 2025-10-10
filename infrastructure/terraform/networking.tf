module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"

  name = local.name_prefix
  cidr = var.vpc_cidr

  azs                 = var.availability_zones
  public_subnets      = var.public_subnet_cidrs
  private_subnets     = var.private_subnet_cidrs
  database_subnets    = var.database_subnet_cidrs
  create_database_subnet_group = true

  enable_nat_gateway = true
  single_nat_gateway = false
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.common_tags
}

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb"
  description = "Allow HTTPS inbound"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description      = "HTTPS"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    "Name" = "${local.name_prefix}-alb"
  })
}

resource "aws_security_group" "service" {
  name        = "${local.name_prefix}-svc"
  description = "Allow traffic from ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    "Name" = "${local.name_prefix}-svc"
  })
}

resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-db"
  description = "Allow database access from services"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.service.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    "Name" = "${local.name_prefix}-db"
  })
}
