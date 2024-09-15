from aws_cdk import App, Environment, DefaultStackSynthesizer
from cdk_python.cdk_python_stack import PilaEc2
import boto3

# Obtener automáticamente el Account ID y la región
session = boto3.session.Session()
account_id = boto3.client('sts').get_caller_identity()['Account']
region = session.region_name

# Definir un nuevo qualifier
qualifier = "ec2-dep"

app = App()

# Definir el entorno con el Account ID y la región obtenidos automáticamente
env = Environment(account=account_id, region=region)

# Configurar el sintetizador con el qualifier correcto y el nombre del bucket basado en el qualifier
sintetizador = DefaultStackSynthesizer(
    qualifier=qualifier,  # Usar el qualifier dinámico
    cloud_formation_execution_role=f"arn:aws:iam::{account_id}:role/LabRole",
    file_assets_bucket_name=f"cdk-{qualifier}-assets-{account_id}-{region}"  # Usar el qualifier en el nombre del bucket
)

# Crear el stack y pasar el sintetizador con LabRole
PilaEc2(app, "PilaEc2", env=env, synthesizer=sintetizador)

app.synth()

