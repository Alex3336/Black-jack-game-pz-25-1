from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os
import json
import random
import string
from flask import request

app = Flask(__name__, static_folder="../build", static_url_path="")

CORS(app)

rooms = {}


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/cards")
def cards():
    with open("src/cards.json", encoding="utf-8") as f:
        return jsonify(json.load(f))


def generate_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@app.route("/create-room", methods=["POST"])
def create_room():
    code = generate_code()
    rooms[code] = {"players": ["creator"]}
    return {"room": code}


@app.route("/room-status", methods=["POST"])
def room_status():
    data = request.json
    room = data.get("room")

    if room not in rooms:
        return {"error": "Кімнату не знайдено"}, 404

    players_count = len(rooms[room]["players"])
    status = "Гра почалася!" if players_count >= 2 else "Очікування другого гравця..."
    return {"status": status, "players": players_count}


@app.route("/join-room", methods=["POST"])
def join_room():
    data = request.json
    room = data["room"]
    
    if room not in rooms:
        return {"error": "Room not found"}, 404
    rooms[room]["players"].append("player")
    return {"ok": True, "room": room, "players": len(rooms[room]["players"])}


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
