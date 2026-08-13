########################################
# Latest Ubuntu 24.04 LTS
########################################

data "aws_ami" "ubuntu" {

  most_recent = true

  owners = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

}

########################################
# EC2 Instance
########################################

resource "aws_instance" "backend" {

  ami = data.aws_ami.ubuntu.id

  instance_type = var.instance_type

  subnet_id = var.public_subnet_id

  key_name = var.key_name

  vpc_security_group_ids = [
    var.security_group_id
  ]

  iam_instance_profile = var.instance_profile_name

  associate_public_ip_address = true
  user_data                   = file("${path.root}/scripts/ec2_user_data.sh")

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-ec2"
    }
  )

}

########################################
# Elastic IP
########################################

resource "aws_eip" "backend" {

  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-eip"
    }
  )

}

resource "aws_eip_association" "backend" {

  instance_id   = aws_instance.backend.id
  allocation_id = aws_eip.backend.id

}