import base64
import io
import json
import string
import time
import secrets

import psycopg2
import qrcode
from cryptography.fernet import Fernet


def read_secret(name):
    with open(f"/var/openfaas/secrets/{name}", "r") as f:
        return f.read().strip()


def get_db_connection():
    return psycopg2.connect(
        host=read_secret("db-host"),
        port=read_secret("db-port"),
        dbname=read_secret("db-name"),
        user=read_secret("db-user"),
        password=read_secret("db-password"),
    )


def generate_password(length=24):
    special_chars = "!@#$%^&*()-_=+[]{};:,.?"
    pools = [
        string.ascii_lowercase,
        string.ascii_uppercase,
        string.digits,
        special_chars,
    ]

    password_chars = [secrets.choice(pool) for pool in pools]
    all_chars = "".join(pools)

    password_chars += [
        secrets.choice(all_chars)
        for _ in range(length - len(password_chars))
    ]

    secrets.SystemRandom().shuffle(password_chars)
    return "".join(password_chars)


def generate_qr_base64(value):
    img = qrcode.make(value)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def handle(event, context):
    try:
        body = json.loads(event.body or "{}")
        username = body.get("username")

        if not username:
            return {
                "statusCode": 400,
                "body": {
                    "error": "Le champ 'username' est obligatoire."
                }
            }

        password = generate_password()
        gendate = int(time.time())

        cipher = Fernet(read_secret("encryption-key").encode("utf-8"))
        encrypted_password = cipher.encrypt(password.encode("utf-8")).decode("utf-8")

        conn = get_db_connection()

        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO app_users (username, password, mfa, gendate, expired)
                    VALUES (%s, %s, NULL, %s, FALSE)
                    ON CONFLICT (username)
                    DO UPDATE SET
                        password = EXCLUDED.password,
                        gendate = EXCLUDED.gendate,
                        expired = FALSE,
                        updated_at = CURRENT_TIMESTAMP;
                    """,
                    (username, encrypted_password, gendate)
                )

        conn.close()

        qr_code = generate_qr_base64(password)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "message": "Mot de passe généré avec succès.",
                "username": username,
                "password": password,
                "qr_code_png_base64": qr_code,
                "gendate": gendate
            }
        }

    except Exception as e:
        print(f"Erreur generate-password: {str(e)}")
        return {
            "statusCode": 500,
            "body": {
                "error": "Erreur interne lors de la génération du mot de passe.",
                "details": str(e)
            }
        }
