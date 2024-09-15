from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    CfnParameter,
    CfnOutput,
    Tags
)
from constructs import Construct
from datetime import datetime

class PilaEc2(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        # Generar un ID único usando la fecha y hora actual
        id_unico = f"ec2-instancia-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        super().__init__(scope, id_unico, **kwargs)

        # Parámetro para el nombre de la instancia
        ec2Nombre = CfnParameter(self, "ec2-nombre", type="String", default="MV Default",
                                  description="Nombre de la instancia")

        # Parámetro para la AMI de Ubuntu
        ami = CfnParameter(self, "ami", type="String", default="ami-0aa28dab1f2852040",
                           description="Ubuntu Server 22.04 LTS")

        # Usar el IAM Role existente 'LabRole'
        rol = iam.Role.from_role_arn(self, "rol", role_arn=f"arn:aws:iam::{self.account}:role/LabRole")

        # Obtener la VPC predeterminada
        nube = ec2.Vpc.from_lookup(self, "vpc", is_default=True)

        # Crear el grupo de seguridad
        grupoSeguridad = ec2.SecurityGroup(
            self, "grupo-seguridad-ec2",
            vpc=nube,
            description="Permitir trafico SSH y HTTP desde 0.0.0.0/0",
            allow_all_outbound=True
        )

        grupoSeguridad.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(22),
            "Permitir SSH"
        )

        grupoSeguridad.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Permitir HTTP"
        )

        # Comandos de User Data para la instancia
        datosUsuario = ec2.UserData.for_linux()
        datosUsuario.add_commands(
            "#!/bin/bash",
            "cd /var/www/html/",
            "git clone https://github.com/utec-cc-2024-2-test/websimple.git",
            "git clone https://github.com/utec-cc-2024-2-test/webplantilla.git",
            "ls -l"
        )

        # Crear la instancia EC2
        ec2Instancia = ec2.Instance(
            self, id_unico,  # Usar el ID único generado
            instance_type=ec2.InstanceType("t2.micro"),
            machine_image=ec2.MachineImage.generic_linux({ "us-east-1": ami.value_as_string }),
            vpc=nube,
            security_group=grupoSeguridad,
            key_pair=ec2.KeyPair.from_key_pair_name(self, "keyPair", "vockey"),
            role=rol,
            block_devices=[ec2.BlockDevice(
                device_name="/dev/sda1",
                volume=ec2.BlockDeviceVolume.ebs(20)
            )],
            user_data=datosUsuario
        )

        # Añadir etiquetas (Tags) a la instancia
        Tags.of(ec2Instancia).add('Name', ec2Nombre.value_as_string)

        # Salidas
        CfnOutput(self, "ID", value=ec2Instancia.instance_id)
        CfnOutput(self, "IP Publica", value=ec2Instancia.instance_public_ip)
        CfnOutput(self, "websimpleURL", value=f"http://{ec2Instancia.instance_public_ip}/websimple")
        CfnOutput(self, "webplantillaURL", value=f"http://{ec2Instancia.instance_public_ip}/webplantilla")

