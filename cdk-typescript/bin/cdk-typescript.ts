import * as cdk from 'aws-cdk-lib';
import { CdkTypescriptStack } from '../lib/cdk-typescript-stack';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

async function main() {
  const app = new cdk.App();

  // Crear un cliente de STS con la región
  const stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' });

  // Obtener el ID de la cuenta usando la sintaxis de AWS SDK v3
  const data = await stsClient.send(new GetCallerIdentityCommand({}));
  const accountId = data.Account!;  // ID de la cuenta obtenida
  const region = process.env.AWS_REGION || 'us-east-1';  // Región predeterminada si no está definida en el entorno

  // Definir un nuevo qualifier
  const qualifier = 'ec2-dep';  // Usar el nuevo qualifier dinámico

  // Definir el entorno con el ID de la cuenta y la región obtenidos
  const env = { account: accountId, region: region };

  // Configurar el sintetizador con el qualifier correcto y el bucket basado en el bootstrap
  const sintetizador = new cdk.DefaultStackSynthesizer({
    qualifier: qualifier,  // Usar el qualifier dinámico
    cloudFormationExecutionRole: `arn:aws:iam::${accountId}:role/LabRole`,  // Usar el rol LabRole
    fileAssetsBucketName: `cdk-${qualifier}-assets-${accountId}-${region}`,  // Usar el qualifier en el nombre del bucket
  });

  // Crear el stack y pasar el sintetizador con LabRole
  new CdkTypescriptStack(app, 'PilaEc2', { env, synthesizer: sintetizador });

  // Sintetizar la aplicación CDK
  app.synth();
}

// Ejecutar la función principal
main();

