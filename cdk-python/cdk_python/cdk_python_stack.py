from aws_cdk import (
    Stack,
    CfnParameter,
    CfnOutput,
    aws_ec2 as ec2,
    aws_iam as iam
)
from constructs import Construct

class Pila_Ec2(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Parámetros

        ec2_nombre = CfnParameter(self, "ec2_nombre", type="String", default="MV Default",
                                     description="Nombre de la instancia")
        ami = CfnParameter(self, "ami", type="String", default="ami-0aa28dab1f2852040",
                              description="Ubuntu Server 22.04 LTS")

        rol = iam.Role.from_role_arn(self, "rol", role_arn="arn:aws:iam::670006807599:role/LabRole")

        nube = ec2.Vpc.from_lookup(self, "vpc", is_default=True)

        grupo_seguridad = ec2.SecurityGroup(
            self, "grupo_seguridad_ec2",
            vpc=nube,
            description="Se permite el trafico SSH y HTTP desde 0.0.0.0/0",
            allow_all_outbound=True
        )

        grupo_seguridad.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(22),
            "Permitir SSH"
        )

        grupo_seguridad.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Permitir HTTP"
        )

        # Instancia EC2 con 'LabRole'
        ec2_instancia = ec2.Instance(
            self, "ec2_intancia",
            instance_type=ec2.InstanceType("t2.micro"),
            machine_image=ec2.MachineImage.generic_linux({ "us-east-1": ami.value_as_string }),
            vpc=nube,
            security_group=grupo_seguridad,
            key_name="vockey",
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
        ec2_instancia.instance.tags.set_tag('Name', f'{ec2_nombre.value_as_string}')

        # Salidas
        CfnOutput(self, "ID", value=ec2_instancia.instance_id)
        CfnOutput(self, "IP Publica", value=ec2_instancia.instance_public_ip)
        CfnOutput(self, "websimpleURL", value=f"http://{ec2_instancia.instance_public_ip}/websimple")
        CfnOutput(self, "webplantillaURL", value=f"http://{ec2_instancia.instance_public_ip}/webplantilla")

