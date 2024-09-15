import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class CdkTypescriptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Parámetros de EC2
    const ec2Nombre = new cdk.CfnParameter(this, 'ec2-nombre', {
      type: 'String',
      default: 'MV Default',
      description: 'Nombre de la instancia',
    });

    const ami = new cdk.CfnParameter(this, 'ami', {
      type: 'String',
      default: 'ami-0aa28dab1f2852040',
      description: 'Ubuntu Server 22.04 LTS',
    });

    // Usar el IAM Role existente 'LabRole'
    const role = iam.Role.fromRoleArn(this, 'rol', `arn:aws:iam::${this.account}:role/LabRole`);

    // VPC predeterminado
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', { isDefault: true });

    // Grupo de Seguridad
    const securityGroup = new ec2.SecurityGroup(this, 'grupo-seguridad-ec2', {
      vpc,
      description: 'Se permite el trafico SSH y HTTP desde 0.0.0.0/0',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Permitir SSH');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Permitir HTTP');

    // Referencia a la cubeta personalizada de bootstrap
    const stagingBucket = s3.Bucket.fromBucketName(this, 'CustomStagingBucket', `${this.account}-staging-bucket`);

    // Crear el key pair
    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'vockey');

    // Instancia EC2
    const instance = new ec2.Instance(this, 'ec2-instancia', {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ec2.MachineImage.genericLinux({ 'us-east-1': ami.valueAsString }),
      vpc,
      securityGroup,
      keyPair: keyPair,  // Usar el keyPair
      role,
      blockDevices: [{ deviceName: '/dev/sda1', volume: ec2.BlockDeviceVolume.ebs(20) }],
      userData: ec2.UserData.custom(`
        #!/bin/bash
        cd /var/www/html/
        git clone https://github.com/utec-cc-2024-2-test/websimple.git
        git clone https://github.com/utec-cc-2024-2-test/webplantilla.git
        ls -l
      `),
    });

    // Cambiar el nombre a la instancia EC2
    cdk.Tags.of(instance).add('Name', ec2Nombre.valueAsString);

    // Salidas
    new cdk.CfnOutput(this, 'ID', { value: instance.instanceId });
    new cdk.CfnOutput(this, 'IPPublica', { value: instance.instancePublicIp });
    new cdk.CfnOutput(this, 'websimpleURL', { value: `http://${instance.instancePublicIp}/websimple` });
    new cdk.CfnOutput(this, 'webplantillaURL', { value: `http://${instance.instancePublicIp}/webplantilla` });
  }
}
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class CdkTypescriptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Parámetros de EC2
    const ec2Nombre = new cdk.CfnParameter(this, 'ec2-nombre', {
      type: 'String',
      default: 'MV Default',
      description: 'Nombre de la instancia',
    });

    const ami = new cdk.CfnParameter(this, 'ami', {
      type: 'String',
      default: 'ami-0aa28dab1f2852040',
      description: 'Ubuntu Server 22.04 LTS',
    });

    // Usar el IAM Role existente 'LabRole'
    const role = iam.Role.fromRoleArn(this, 'rol', `arn:aws:iam::${this.account}:role/LabRole`);

    // VPC predeterminado
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', { isDefault: true });

    // Grupo de Seguridad
    const securityGroup = new ec2.SecurityGroup(this, 'grupo-seguridad-ec2', {
      vpc,
      description: 'Se permite el trafico SSH y HTTP desde 0.0.0.0/0',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Permitir SSH');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Permitir HTTP');

    // Referencia a la cubeta personalizada de bootstrap
    const stagingBucket = s3.Bucket.fromBucketName(this, 'CustomStagingBucket', `${this.account}-staging-bucket`);

    // Crear el key pair
    const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'vockey');

    // User Data para la instancia
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash', // Línea Shebang
      'cd /var/www/html/',
      'git clone https://github.com/utec-cc-2024-2-test/websimple.git',
      'git clone https://github.com/utec-cc-2024-2-test/webplantilla.git',
      'ls -l'
    );

    // Instancia EC2
    const instance = new ec2.Instance(this, 'ec2-instancia', {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ec2.MachineImage.genericLinux({ 'us-east-1': ami.valueAsString }),
      vpc,
      securityGroup,
      keyName: 'vockey',  // Especificando el nombre del key pair
      role,
      blockDevices: [{ deviceName: '/dev/sda1', volume: ec2.BlockDeviceVolume.ebs(20) }],
      userData: userData, // Asignando el userData configurado
    });

    // Cambiar el nombre a la instancia EC2
    cdk.Tags.of(instance).add('Name', ec2Nombre.valueAsString);

    // Salidas
    new cdk.CfnOutput(this, 'ID', { value: instance.instanceId });
    new cdk.CfnOutput(this, 'IPPublica', { value: instance.instancePublicIp });
    new cdk.CfnOutput(this, 'websimpleURL', { value: `http://${instance.instancePublicIp}/websimple` });
    new cdk.CfnOutput(this, 'webplantillaURL', { value: `http://${instance.instancePublicIp}/webplantilla` });
  }
}

