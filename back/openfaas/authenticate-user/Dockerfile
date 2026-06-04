FROM python:3.11-slim

WORKDIR /home/app

# Installation des dépendances système si nécessaire (ex: libpq-dev pour psycopg2)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install flask gunicorn

COPY . .

# On crée un petit script de wrapper pour simuler l'environnement OpenFaaS via Flask
RUN echo 'from flask import Flask, request, jsonify\n\
import handler\n\
import json\n\
\n\
app = Flask(__name__)\n\
\n\
class Event:\n\
    def __init__(self, body):\n\
        self.body = body\n\
\n\
@app.route("/", methods=["POST"])\n\
@app.route("/<path:path>", methods=["POST"])\n\
def main(path=""):\n\
    event = Event(request.get_data(as_text=True))\n\
    res = handler.handle(event, None)\n\
    return (json.dumps(res["body"]), res["statusCode"], res["headers"])\n\
\n\
if __name__ == "__main__":\n\
    app.run(host="0.0.0.0", port=5000)' > server.py

EXPOSE 5000

CMD ["python", "server.py"]
