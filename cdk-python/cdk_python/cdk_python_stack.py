from aws_cdk import (
    Stack,
    CfnParameter,
    CfnOutput,
    aws_ec2 as ec2,
    aws_iam as iam
)
from constructs import Construct

class PilaEc2(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Parámetros
        ec2Nombre = CfnParameter(self, "ec2-nombre", type="String", default="MV Default",
                                     description="Nombre de la instancia")
        ami = CfnParameter(self, "ami", type="String", default="ami-0aa28dab1f2852040",
                              description="Ubuntu Server 22.04 LTS")

        rol = iam.Role.from_role_arn(self, "rol", role_arn="arn:aws:iam::670006807599:role/LabRole")

        nube = ec2.Vpc.from_lookup(self, "vpc", is_default=True)

        grupoSeguridad = ec2.SecurityGroup(
            self, "grupo-seguridad-ec2",
            vpc=nube,
            description="Se permite el trafico SSH y HTTP desde 0.0.0.0/0",
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

        # Instancia EC2 con 'LabRole'
        ec2Instancia = ec2.Instance(
            self, "ec2-instancia",
            instance_type=ec2.InstanceType("t2.micro"),
            machine_image=ec2.MachineImage.generic_linux({ "us-east-1": ami.value_as_string }),
            vpc=nube,
            security_group=grupoSeguridad,
            key_pair="vockey",
            role=rol,  # Usar 'LabRole'
            block_devices=[ec2.BlockDevice(
                device_name="/dev/sda1",
                volume=ec2.BlockDeviceVolume.ebs(20)
            )],
            user_data=ec2.UserData.custom('''
                #!/bin/bash
                cd /var/www/html/
                git clone https://github.com/utec-cc-2024-2-test/websimple.git
                git clone https://github.com/utec-cc-2024-2-test/webplantilla.git
                ls -l
            ''')
        )

        # Cambiando el nombre a la MV
        ec2Instancia.instance.tags.set_tag('Name', f'{ec2Nombre.value_as_string}')

        # Salidas
        CfnOutput(self, "ID", value=ec2Instancia.instance_id)
        CfnOutput(self, "IP Publica", value=ec2Instancia.instance_public_ip)
        CfnOutput(self, "websimpleURL", value=f"http://{ec2Instancia.instance_public_ip}/websimple")
        CfnOutput(self, "webplantillaURL", value=f"http://{ec2Instancia.instance_public_ip}/webplantilla")

