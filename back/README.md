# Backend — MSPR COFRAP Serverless

Ce dossier contient uniquement la partie backend du projet MSPR.

Le backend est basé sur OpenFaaS, Kubernetes K3S et PostgreSQL. Il permet de générer des identifiants sécurisés pour un utilisateur, de générer un secret 2FA/TOTP, puis d'authentifier l'utilisateur avec son login, son mot de passe et son code 2FA.

---

## 1. Objectif du backend

Le backend répond au besoin suivant :

- générer automatiquement un mot de passe fort pour un utilisateur ;
- générer un QR Code associé au mot de passe ;
- chiffrer le mot de passe avant stockage ;
- générer un secret 2FA/TOTP ;
- générer un QR Code compatible avec une application d'authentification ;
- chiffrer le secret 2FA avant stockage ;
- authentifier un utilisateur avec son login, son mot de passe et son code 2FA ;
- vérifier l'expiration des identifiants au bout de six mois ;
- stocker les informations utilisateur dans PostgreSQL ;
- exposer les traitements sous forme de fonctions serverless OpenFaaS.

---

## 2. Technologies utilisées

| Besoin | Technologie |
|---|---|
| Serverless | OpenFaaS Community |
| Orchestration | Kubernetes K3S |
| Base de données | PostgreSQL |
| Langage backend | Python |
| Déploiement des fonctions | OpenFaaS CLI |
| Conteneurisation | Docker |
| Registry | Docker Hub |
| Chiffrement applicatif | Fernet, bibliothèque `cryptography` |
| 2FA | TOTP, bibliothèque `pyotp` |
| QR Code | Bibliothèque `qrcode` |

---

## 3. Architecture backend

```text
Utilisateur / Frontend
        |
        v
OpenFaaS Gateway
        |
        +---------------------+
        |                     |
        v                     v
generate-password       generate-2fa
        |                     |
        +----------+----------+
                   |
                   v
            PostgreSQL
                   |
                   v
          authenticate-user
```

Les fonctions OpenFaaS communiquent avec PostgreSQL via le service Kubernetes :

```text
postgres.cofrap.svc.cluster.local:5432
```

---

## 4. Structure du dossier backend

```text
back/
├── README.md
├── openfaas/
│   ├── stack.yml
│   ├── generate-password/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── generate-2fa/
│   │   ├── handler.py
│   │   └── requirements.txt
│   └── authenticate-user/
│       ├── handler.py
│       └── requirements.txt
├── k8s/
│   └── postgres.yaml
├── scripts/
└── docs/
```

---

## 5. Fonctions backend

### 5.1 generate-password

Cette fonction crée ou renouvelle le mot de passe d'un utilisateur.

Entrée attendue :

```json
{
  "username": "michel.ranu"
}
```

Traitements réalisés :

- vérification de la présence du champ `username` ;
- génération d'un mot de passe de 24 caractères ;
- présence obligatoire de majuscules, minuscules, chiffres et caractères spéciaux ;
- chiffrement du mot de passe avec Fernet ;
- insertion ou mise à jour de l'utilisateur en base ;
- génération d'un QR Code contenant le mot de passe ;
- retour du mot de passe et du QR Code encodé en base64.

Exemple d'appel :

```bash
curl -X POST http://127.0.0.1:8080/function/generate-password \
  -H "Content-Type: application/json" \
  -d '{"username":"michel.ranu"}'
```

---

### 5.2 generate-2fa

Cette fonction génère le secret 2FA/TOTP d'un utilisateur existant.

Entrée attendue :

```json
{
  "username": "michel.ranu"
}
```

Traitements réalisés :

- vérification de la présence du champ `username` ;
- vérification de l'existence de l'utilisateur ;
- génération d'un secret TOTP ;
- génération d'une URI compatible avec Google Authenticator, Microsoft Authenticator ou équivalent ;
- génération du QR Code associé ;
- chiffrement du secret 2FA avec Fernet ;
- mise à jour de la colonne `mfa` en base PostgreSQL.

Exemple d'appel :

```bash
curl -X POST http://127.0.0.1:8080/function/generate-2fa \
  -H "Content-Type: application/json" \
  -d '{"username":"michel.ranu"}'
```

---

### 5.3 authenticate-user

Cette fonction authentifie un utilisateur.

Entrée attendue :

```json
{
  "username": "michel.ranu",
  "password": "mot-de-passe-genere",
  "code_2fa": "123456"
}
```

Traitements réalisés :

- vérification des champs obligatoires ;
- recherche de l'utilisateur en base ;
- vérification que le compte n'est pas déjà expiré ;
- vérification que les identifiants datent de moins de six mois ;
- déchiffrement du mot de passe stocké ;
- déchiffrement du secret 2FA stocké ;
- comparaison du mot de passe fourni ;
- vérification du code TOTP ;
- retour du résultat d'authentification.

Exemple d'appel :

```bash
curl -X POST http://127.0.0.1:8080/function/authenticate-user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "michel.ranu",
    "password": "mot-de-passe-genere",
    "code_2fa": "123456"
  }'
```

Résultat attendu en cas de succès :

```json
{
  "authenticated": true,
  "message": "Authentification réussie.",
  "username": "michel.ranu"
}
```

---

## 6. Base de données PostgreSQL

La base PostgreSQL est déployée dans Kubernetes dans le namespace `cofrap`.

Table utilisée :

```sql
CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT,
  mfa TEXT,
  gendate BIGINT,
  expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Déploiement PostgreSQL :

```bash
kubectl apply -f back/k8s/postgres.yaml
```

Vérification du pod :

```bash
kubectl -n cofrap get pods
```

Vérification du service :

```bash
kubectl -n cofrap get svc
```

Connexion à PostgreSQL :

```bash
kubectl -n cofrap exec -it postgres-0 -- psql -U cofrap_user -d cofrap_db
```

Afficher les utilisateurs :

```sql
SELECT id, username, password, mfa, gendate, expired FROM app_users;
```

Quitter PostgreSQL :

```sql
\q
```

---

## 7. Secrets OpenFaaS

Les fonctions utilisent des secrets OpenFaaS pour éviter de stocker les informations sensibles directement dans le code.

Secrets nécessaires :

```text
db-host
db-port
db-name
db-user
db-password
encryption-key
```

Création des secrets en environnement local de développement :

```bash
printf "postgres.cofrap.svc.cluster.local" | faas-cli secret create db-host
printf "5432" | faas-cli secret create db-port
printf "cofrap_db" | faas-cli secret create db-name
printf "cofrap_user" | faas-cli secret create db-user
printf "cofrap_password" | faas-cli secret create db-password
```

Création de la clé de chiffrement :

```bash
python3 - <<'PY' > encryption-key.txt
import base64
import os

print(base64.urlsafe_b64encode(os.urandom(32)).decode())
PY

cat encryption-key.txt | faas-cli secret create encryption-key
rm -f encryption-key.txt
```

Vérification :

```bash
faas-cli secret list
```

---

## 8. Déploiement OpenFaaS

Le fichier de déploiement des fonctions est :

```text
back/openfaas/stack.yml
```

Se placer dans le dossier OpenFaaS :

```bash
cd back/openfaas
```

Récupérer le template Python si nécessaire :

```bash
faas-cli template store pull python3-http-debian
```

Construire les images :

```bash
faas-cli build -f stack.yml
```

Pousser les images vers Docker Hub :

```bash
faas-cli push -f stack.yml
```

Déployer les fonctions :

```bash
faas-cli deploy -f stack.yml
```

Vérifier les fonctions déployées :

```bash
faas-cli list
```

Résultat attendu :

```text
Function                        Invocations     Replicas
authenticate-user               0               1
generate-2fa                    0               1
generate-password               0               1
```

---

## 9. Port-forward OpenFaaS

Pour tester localement depuis Ubuntu WSL, le gateway OpenFaaS doit être exposé sur le port `8080`.

Dans un terminal dédié :

```bash
kubectl port-forward -n openfaas svc/gateway 8080:8080
```

Dans un autre terminal :

```bash
export OPENFAAS_URL=http://127.0.0.1:8080
```

Connexion à OpenFaaS :

```bash
PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode; echo)

echo -n "$PASSWORD" | faas-cli login --username admin --password-stdin
```

---

## 10. Scénario de test complet

### Étape 1 : génération du mot de passe

```bash
curl -X POST http://127.0.0.1:8080/function/generate-password \
  -H "Content-Type: application/json" \
  -d '{"username":"michel.ranu"}'
```

Conserver la valeur retournée dans le champ `password`.

---

### Étape 2 : génération du secret 2FA

```bash
curl -X POST http://127.0.0.1:8080/function/generate-2fa \
  -H "Content-Type: application/json" \
  -d '{"username":"michel.ranu"}'
```

Conserver la valeur retournée dans le champ `secret_2fa`.

---

### Étape 3 : génération locale d'un code TOTP

Créer un environnement Python local si nécessaire :

```bash
python3 -m venv ~/cofrap-venv
source ~/cofrap-venv/bin/activate
pip install pyotp
```

Générer un code TOTP :

```bash
python3 - <<'PY'
import pyotp

secret = "COLLER_ICI_LE_SECRET_2FA"
print(pyotp.TOTP(secret).now())
PY
```

---

### Étape 4 : authentification

Remplacer :

- `MOT_DE_PASSE_GENERE` par le mot de passe retourné par `generate-password` ;
- `CODE_2FA` par le code TOTP généré.

```bash
curl -X POST http://127.0.0.1:8080/function/authenticate-user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "michel.ranu",
    "password": "MOT_DE_PASSE_GENERE",
    "code_2fa": "CODE_2FA"
  }'
```

Réponse attendue :

```json
{
  "authenticated": true,
  "message": "Authentification réussie.",
  "username": "michel.ranu"
}
```

---

## 11. Gestion de l'expiration

La fonction `authenticate-user` considère que les identifiants expirent après six mois.

La durée utilisée dans le code est :

```python
SIX_MONTHS_SECONDS = 60 * 60 * 24 * 30 * 6
```

Si les identifiants sont expirés :

- le compte est marqué comme expiré en base ;
- la colonne `expired` passe à `TRUE` ;
- la fonction retourne une action de renouvellement.

Exemple de réponse :

```json
{
  "authenticated": false,
  "error": "Identifiants expirés depuis plus de six mois.",
  "action": "RENEW_CREDENTIALS"
}
```

---

## 12. Commandes utiles

Voir les pods PostgreSQL :

```bash
kubectl -n cofrap get pods
```

Voir les logs PostgreSQL :

```bash
kubectl -n cofrap logs postgres-0
```

Voir les pods OpenFaaS :

```bash
kubectl -n openfaas get pods
kubectl -n openfaas-fn get pods
```

Voir les logs d'une fonction :

```bash
kubectl -n openfaas-fn logs deploy/generate-password
kubectl -n openfaas-fn logs deploy/generate-2fa
kubectl -n openfaas-fn logs deploy/authenticate-user
```

Redéployer une fonction après modification :

```bash
cd back/openfaas

faas-cli build -f stack.yml
faas-cli push -f stack.yml
faas-cli deploy -f stack.yml
```

---

## 13. Sécurité

Les choix de sécurité appliqués dans ce PoC sont :

- mot de passe fort de 24 caractères ;
- obligation d'utiliser la 2FA ;
- chiffrement du mot de passe avant stockage ;
- chiffrement du secret 2FA avant stockage ;
- secrets OpenFaaS pour les informations sensibles ;
- expiration des identifiants après six mois.

Limites du PoC :

- pas de protection contre la création massive de comptes ;
- pas de rate limiting ;
- pas de journalisation avancée ;
- pas de gestion fine des rôles ;
- pas de rotation automatique réellement planifiée ;
- pas de gestion de production des secrets.

Ces limites sont acceptables dans le cadre du PoC, mais devront être traitées avant une mise en production.

---

## 14. État actuel du backend

Fonctionnalités validées localement :

- déploiement K3S ;
- déploiement PostgreSQL ;
- déploiement OpenFaaS ;
- création des secrets OpenFaaS ;
- fonction `generate-password` fonctionnelle ;
- fonction `generate-2fa` fonctionnelle ;
- fonction `authenticate-user` fonctionnelle ;
- authentification réussie avec login, mot de passe et code 2FA.

