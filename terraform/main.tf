data "aws_availability_zones" "available" {
  state = "available"
}

module "networking" {

  source = "./modules/networking"

  project_name         = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidr   = var.public_subnet_cidr
  public_subnet_2_cidr = var.public_subnet_2_cidr

  availability_zone   = data.aws_availability_zones.available.names[0]
  availability_zone_2 = data.aws_availability_zones.available.names[1]

  common_tags = local.common_tags

}

module "security" {

  source = "./modules/security"

  project_name = local.name_prefix

  vpc_id = module.networking.vpc_id

  common_tags = local.common_tags

}

module "iam" {

  source = "./modules/iam"

  project_name = local.name_prefix

  common_tags = local.common_tags

}

module "ecr" {

  source = "./modules/ecr"

  project_name = local.name_prefix

  common_tags = local.common_tags



}

# module "ec2" {
#   source = "./modules/ec2"
#   project_name = local.name_prefix
#   common_tags = local.common_tags
#   public_subnet_id = module.networking.public_subnet_id
#   security_group_id = module.security.security_group_id
#   instance_profile_name = module.iam.instance_profile_name
#   key_name = var.key_name
# }

module "alb" {
  source = "./modules/alb"

  project_name          = local.name_prefix
  vpc_id                = module.networking.vpc_id
  public_subnets        = [module.networking.public_subnet_id, module.networking.public_subnet_2_id]
  ec2_security_group_id = module.security.security_group_id
  common_tags           = local.common_tags
}

module "asg" {
  source = "./modules/asg"

  project_name          = local.name_prefix
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = [module.networking.public_subnet_id, module.networking.public_subnet_2_id]
  security_group_id     = module.security.security_group_id
  instance_profile_name = module.iam.instance_profile_name
  target_group_arns     = [module.alb.target_group_arn]
  key_name              = var.key_name
  common_tags           = local.common_tags
}