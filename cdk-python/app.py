from aws_cdk import App, Environment, DefaultStackSynthesizer
from cdk_python.cdk_python_stack import PilaEc2
import boto3

# Obtener automáticamente el Account ID y la región
session = boto3.session.Session()
account_id = boto3.client('sts').get_caller_identity()['Account']
region = session.region_name

app = App()

# Definir el entorno con el Account ID y la región obtenidos automáticamente
env = Environment(account=account_id, region=region)

# Configurar el sintetizador con el rol LabRole
sintetizador = DefaultStackSynthesizer(
    cloud_formation_execution_role=f"arn:aws:iam::{account_id}:role/LabRole"
)

# Crear el stack y pasar el sintetizador con LabRole
PilaEc2(app, "PilaEc2", env=env, synthesizer=sintetizador)

app.synth()

