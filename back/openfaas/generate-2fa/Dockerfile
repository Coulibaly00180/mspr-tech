FROM python:3.11-slim

WORKDIR /home/app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install flask gunicorn

COPY . .

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
def main():\n\
    event = Event(request.get_data(as_text=True))\n\
    res = handler.handle(event, None)\n\
    status = res.get("statusCode", 200)\n\
    headers = res.get("headers", {"Content-Type": "application/json"})\n\
    body = res.get("body", {})\n\
    return (json.dumps(body), status, headers)\n\
\n\
if __name__ == "__main__":\n\
    app.run(host="0.0.0.0", port=5000)' > server.py

EXPOSE 5000

CMD ["python", "server.py"]
