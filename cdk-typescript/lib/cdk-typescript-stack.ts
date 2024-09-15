import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkTypescriptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // Generar un ID único usando la fecha y hora actual
    const idUnico = `ec2-instancia-${new Date().toISOString().replace(/[-:.]/g, "")}`;
    super(scope, idUnico, props);

    // Parámetro para el nombre de la instancia
    const ec2Nombre = new cdk.CfnParameter(this, 'ec2-nombre', {
      type: 'String',
      default: 'MV Default',
      description: 'Nombre de la instancia',
    });

    // Parámetro para la AMI de Ubuntu
    const ami = new cdk.CfnParameter(this, 'ami', {
      type: 'String',
      default: 'ami-0aa28dab1f2852040',
      description: 'Ubuntu Server 22.04 LTS',
    });

    // Usar el IAM Role existente 'LabRole'
    const role = iam.Role.fromRoleArn(this, 'rol', `arn:aws:iam::${this.account}:role/LabRole`);

    // Obtener la VPC predeterminada
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', { isDefault: true });

    // Crear el grupo de seguridad
    const securityGroup = new ec2.SecurityGroup(this, 'grupo-seguridad-ec2', {
      vpc,
      description: 'Permitir trafico SSH y HTTP desde 0.0.0.0/0',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Permitir SSH');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Permitir HTTP');

    // Crear el key pair
    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'vockey');

    // Comandos de User Data para la instancia
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "#!/bin/bash",
      "cd /var/www/html/",
      "git clone https://github.com/utec-cc-2024-2-test/websimple.git",
      "git clone https://github.com/utec-cc-2024-2-test/webplantilla.git",
      "ls -l"
    );

    // Crear la instancia EC2
    const instance = new ec2.Instance(this, idUnico, {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ec2.MachineImage.genericLinux({ 'us-east-1': ami.valueAsString }),
      vpc,
      securityGroup,
      keyName: 'vockey',
      role,
      blockDevices: [{ deviceName: '/dev/sda1', volume: ec2.BlockDeviceVolume.ebs(20) }],
      userData: userData,
    });

    // Añadir etiquetas (Tags) a la instancia
    cdk.Tags.of(instance).add('Name', ec2Nombre.valueAsString);

    // Salidas
    new cdk.CfnOutput(this, 'ID', { value: instance.instanceId });
    new cdk.CfnOutput(this, 'IPPublica', { value: instance.instancePublicIp });
    new cdk.CfnOutput(this, 'websimpleURL', { value: `http://${instance.instancePublicIp}/websimple` });
    new cdk.CfnOutput(this, 'webplantillaURL', { value: `http://${instance.instancePublicIp}/webplantilla` });
  }
}

