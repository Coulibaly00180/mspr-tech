import base64
import io
import json
import time

import psycopg2
import qrcode
import pyotp
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
                "headers": {"Content-Type": "application/json"},
                "body": {
                    "error": "Le champ 'username' est obligatoire."
                }
            }

        secret_2fa = pyotp.random_base32()
        gendate = int(time.time())

        totp_uri = pyotp.totp.TOTP(secret_2fa).provisioning_uri(
            name=username,
            issuer_name="COFRAP"
        )

        qr_code = generate_qr_base64(totp_uri)

        cipher = Fernet(read_secret("encryption-key").encode("utf-8"))
        encrypted_mfa = cipher.encrypt(secret_2fa.encode("utf-8")).decode("utf-8")

        conn = get_db_connection()

        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE app_users
                    SET
                        mfa = %s,
                        gendate = %s,
                        expired = FALSE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE username = %s
                    RETURNING id;
                    """,
                    (encrypted_mfa, gendate, username)
                )

                updated_user = cur.fetchone()

                if updated_user is None:
                    return {
                        "statusCode": 404,
                        "headers": {"Content-Type": "application/json"},
                        "body": {
                            "error": "Utilisateur introuvable. Générez d'abord le mot de passe avec generate-password."
                        }
                    }

        conn.close()

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": {
                "message": "Secret 2FA généré avec succès.",
                "username": username,
                "secret_2fa": secret_2fa,
                "totp_uri": totp_uri,
                "qr_code_png_base64": qr_code,
                "gendate": gendate
            }
        }

    except Exception as e:
        print(f"Erreur generate-2fa: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": {
                "error": "Erreur interne lors de la génération du secret 2FA.",
                "details": str(e)
            }
        }
