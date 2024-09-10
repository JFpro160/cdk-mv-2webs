#!/usr/bin/env python3

import boto3
from aws_cdk import App, Environment
from cdk_python.cdk_python_stack import Pila_Ec2

# Obtener automáticamente el Account ID y la región
session = boto3.session.Session()
account_id = boto3.client('sts').get_caller_identity()['Account']
region = session.region_name

app = App()

# Definir el entorno con el Account ID y la región obtenidos automáticamente
env = Environment(account=account_id, region=region)

# Crear el stack y pasar el rol labrole como CloudFormation execution role
Pila_Ec2(app, "Pila_Ec2", env=env)

app.synth()

