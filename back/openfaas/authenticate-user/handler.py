import json
import time

import psycopg2
import pyotp
from cryptography.fernet import Fernet


SIX_MONTHS_SECONDS = 60 * 60 * 24 * 30 * 6


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


def decrypt_value(cipher, encrypted_value):
    return cipher.decrypt(encrypted_value.encode("utf-8")).decode("utf-8")


def json_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": body
    }


def handle(event, context):
    try:
        body = json.loads(event.body or "{}")

        username = body.get("username")
        password = body.get("password")
        code_2fa = body.get("code_2fa")

        if not username or not password or not code_2fa:
            return json_response(400, {
                "authenticated": False,
                "error": "Les champs 'username', 'password' et 'code_2fa' sont obligatoires."
            })

        conn = get_db_connection()

        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, username, password, mfa, gendate, expired
                    FROM app_users
                    WHERE username = %s;
                    """,
                    (username,)
                )

                user = cur.fetchone()

                if user is None:
                    return json_response(404, {
                        "authenticated": False,
                        "error": "Utilisateur introuvable.",
                        "action": "CREATE_ACCOUNT"
                    })

                user_id, db_username, encrypted_password, encrypted_mfa, gendate, expired = user

                if expired:
                    return json_response(403, {
                        "authenticated": False,
                        "error": "Compte expiré.",
                        "action": "RENEW_CREDENTIALS"
                    })

                if encrypted_password is None or encrypted_mfa is None:
                    return json_response(403, {
                        "authenticated": False,
                        "error": "Compte incomplet : mot de passe ou 2FA manquant.",
                        "action": "GENERATE_MISSING_CREDENTIALS"
                    })

                now = int(time.time())

                if now - int(gendate) > SIX_MONTHS_SECONDS:
                    cur.execute(
                        """
                        UPDATE app_users
                        SET expired = TRUE, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s;
                        """,
                        (user_id,)
                    )

                    return json_response(403, {
                        "authenticated": False,
                        "error": "Identifiants expirés depuis plus de six mois.",
                        "action": "RENEW_CREDENTIALS"
                    })

                cipher = Fernet(read_secret("encryption-key").encode("utf-8"))

                stored_password = decrypt_value(cipher, encrypted_password)
                stored_mfa_secret = decrypt_value(cipher, encrypted_mfa)

                if password != stored_password:
                    return json_response(401, {
                        "authenticated": False,
                        "error": "Mot de passe incorrect.",
                        "action": "RETRY_LOGIN"
                    })

                totp = pyotp.TOTP(stored_mfa_secret)

                if not totp.verify(str(code_2fa), valid_window=1):
                    return json_response(401, {
                        "authenticated": False,
                        "error": "Code 2FA incorrect ou expiré.",
                        "action": "RETRY_LOGIN"
                    })

        conn.close()

        return json_response(200, {
            "authenticated": True,
            "message": "Authentification réussie.",
            "username": username
        })

    except Exception as e:
        print(f"Erreur authenticate-user: {str(e)}")
        return json_response(500, {
            "authenticated": False,
            "error": "Erreur interne lors de l'authentification.",
            "details": str(e)
        })
