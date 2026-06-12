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
    data = request.json
    player_name = data.get("player", "Creator")
    code = generate_code()
    rooms[code] = {"players": [player_name], "started": False}
    return {"room": code}


@app.route("/start-game", methods=["POST"])
def start_game():
    data = request.json
    room = data.get("room")
    if room in rooms:
        rooms[room]["started"] = True
        return {"ok": True}
    return {"error": "Кімнату не знайдено"}, 404


@app.route("/room-status", methods=["POST"])
def room_status():
    data = request.json
    room = data.get("room")

    if room not in rooms:
        return {"error": "Кімнату не знайдено"}, 404

    host = rooms[room]["players"][0] if rooms[room]["players"] else None
    players_count = len(rooms[room]["players"])
    is_started = rooms[room]["started"]
    status = "Кімната готова" if players_count >= 2 else "Очікування другого гравця..."
    return {
        "status": status,
        "players": players_count,
        "host": host,
        "started": is_started,
    }


@app.route("/join-room", methods=["POST"])
def join_room():
    data = request.json
    room = data["room"]
    player_name = data.get("player", "Player")

    if room not in rooms:
        return {"error": "Room not found"}, 404
    rooms[room]["players"].append(player_name)
    return {"ok": True, "room": room, "players": len(rooms[room]["players"])}


@app.route("/player-cards", methods=["POST"])
def player_cards():
    data = request.json

    room = data["room"]
    player = data["player"]
    cards = data["cards"]

    if room not in rooms:
        return {"error": "Room not found"}, 404

    if player not in rooms[room]["players"]:
        return {"error": "Player not found"}, 404

    if "cards" not in rooms[room]:
        rooms[room]["cards"] = {}

    rooms[room]["cards"][player] = cards

    host = rooms[room]["players"][0]

    return {"ok": True, "host": host, "cards": rooms[room]["cards"]}


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
