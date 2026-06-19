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


def can_split(hand):
    if len(hand) != 2:
        return False

    v1 = hand[0]["value"]
    v2 = hand[1]["value"]

    if isinstance(v1, list):
        v1 = 11

    if isinstance(v2, list):
        v2 = 11

    return v1 == v2


def save_player(player_name):
    with open("src/players.json", encoding="utf-8") as f:
        players = json.load(f)

    for player in players:
        if player["name"] == player_name:
            return player

    new_player = {"name": player_name, "chips": 1000}

    players.append(new_player)

    with open("src/players.json", "w", encoding="utf-8") as f:
        json.dump(players, f, ensure_ascii=False, indent=4)

    return new_player


def update_player_chips(player_name, chips):

    with open("src/players.json", encoding="utf-8") as f:
        players = json.load(f)

    for player in players:
        if player["name"] == player_name:
            player["chips"] = chips
            break

    with open("src/players.json", "w", encoding="utf-8") as f:
        json.dump(players, f, ensure_ascii=False, indent=4)


def get_val(hand):

    if isinstance(hand[0], list):
        return [get_val(h) for h in hand]

    total = 0
    aces = 0

    for card in hand:
        val = card["value"]

        if isinstance(val, list):
            total += 11
            aces += 1
        else:
            total += val

    while total > 21 and aces:
        total -= 10
        aces -= 1

    return total


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/cards")
def cards():
    with open("src/cards.json", encoding="utf-8") as f:
        return jsonify(json.load(f))


def generate_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def init_deck():
    with open("src/cards.json", encoding="utf-8") as f:
        data = json.load(f)
        deck = data[:-1]
        shoe = deck * 4
        random.shuffle(shoe)
        return shoe


@app.route("/create-room", methods=["POST"])
def create_room():
    data = request.json
    player_name = data.get("player", "Creator")

    player = save_player(player_name)

    code = generate_code()
    rooms[code] = {
        "players": [player_name],
        "started": False,
        "shoe": [],
        "dealer_hand": [],
        "player_hand": [],
        "turn": "player",
        "chips": {player_name: player["chips"]},
        "bets": {},
    }

    return {"room": code}


@app.route("/start-game", methods=["POST"])
def start_game():
    data = request.json
    room = data.get("room")
    if room in rooms:
        r = rooms[room]
        r["shoe"] = init_deck()
        r["hands"] = {}
        for p in r["players"]:
            r["hands"][p] = [r["shoe"].pop(0), r["shoe"].pop(0)]
        r["dealer_hand"] = [r["shoe"].pop(0), r["shoe"].pop(0)]
        r["current_player_index"] = 0
        r["turn"] = "player"
        r["started"] = True
        r["bets"] = {}
        return {"ok": True}
    return {"error": "Кімнату не знайдено"}, 404


@app.route("/room-status", methods=["POST"])
def room_status():
    data = request.json
    room = data.get("room")

    if room not in rooms:
        return {"error": "Кімнату не знайдено"}, 404

    r = rooms[room]
    status = "Кімната готова"
    curr_idx = r.get("current_player_index", 0)
    current_player = (
        r["players"][curr_idx]
        if r["started"] and curr_idx < len(r["players"])
        else None
    )
    return {
        "status": status,
        "players": len(r["players"]),
        "host": r["players"][0] if r["players"] else None,
        "started": r["started"],
        "hands": r.get("hands", {}),
        "dealer_hand": r.get("dealer_hand", []),
        "turn": r.get("turn", "player"),
        "current_player": current_player,
        "chips": r.get("chips", {}),
        "bets": r.get("bets", {}),
    }


@app.route("/player-chips", methods=["POST"])
def player_chips():
    data = request.json
    room = data.get("room")
    player = data.get("player")

    if room not in rooms:
        return {"error": "Room not found"}, 404

    r = rooms[room]

    if player not in r["players"]:
        return {"error": "Player not found"}, 404

    chips = r["chips"].get(player, 0)
    bet = r["bets"].get(player, 0)

    return {"ok": True, "player": player, "chips": chips, "bet": bet}


@app.route("/place-bet", methods=["POST"])
def place_bet():
    data = request.json
    room = data.get("room")
    player = data.get("player")
    bet = int(data.get("bet", 0))

    if room not in rooms:
        return {"error": "Room not found"}, 404

    r = rooms[room]

    if player not in r["players"]:
        return {"error": "Player not found"}, 404

    if r["bets"].get(player, 0) > 0:
        return {"error": "Bet already placed"}, 400

    if bet <= 0:
        return {"error": "Bet must be positive"}, 400

    if r["chips"][player] < bet:
        return {"error": "Not enough chips"}, 400

    r["chips"][player] -= bet
    r["bets"][player] = bet

    update_player_chips(player, r["chips"][player])

    return {
        "ok": True,
        "player": player,
        "chips": r["chips"][player],
        "bet": r["bets"][player],
    }


@app.route("/game-action", methods=["POST"])
def game_action():
    data = request.json
    room = data.get("room")
    action = data.get("action")
    player_name = data.get("player")

    if room not in rooms:
        return {"error": "Room not found"}, 404

    r = rooms[room]
    current_idx = r.get("current_player_index", 0)

    if current_idx >= len(r["players"]):
        return {"error": "Гра вже завершена"}, 400

    current_player = r["players"][current_idx]

    if player_name != current_player or r["turn"] != "player":
        return {"error": "Not your turn"}, 403

    if action == "hit":
        player_hands = r["hands"][player_name]

        # Check if this player has split hands (array of arrays)
        if player_hands and isinstance(player_hands[0], list):
            split_idx = r.get("split_turn", {}).get(player_name, 0)
            if split_idx >= len(player_hands):
                return {"error": "All split hands played"}, 400

            # Add card to the current split sub-hand
            player_hands[split_idx].append(r["shoe"].pop(0))

            # Check if this specific split hand busted
            if get_val(player_hands[split_idx]) > 21:
                # Auto-advance to next split hand
                r["split_turn"][player_name] = split_idx + 1

                # If all split hands played, advance to next player via stand
                if r["split_turn"][player_name] >= len(player_hands):
                    action = "stand"
                else:
                    return {"ok": True}
            else:
                return {"ok": True}
        else:
            r["hands"][player_name].append(r["shoe"].pop(0))
            if get_val(r["hands"][player_name]) > 21:
                action = "stand"

    if action == "stand":
        player_hands = r["hands"].get(player_name, [])

        # Check if this player has split hands
        if player_hands and isinstance(player_hands[0], list):
            split_idx = r.get("split_turn", {}).get(player_name, 0) + 1
            r["split_turn"][player_name] = split_idx

            # If there are still more split hands to play, stay on same player
            if split_idx < len(player_hands):
                return {"ok": True}

        # Advance to next player (no split, or all split hands played)
        current_idx += 1
        r["current_player_index"] = current_idx

        if current_idx >= len(r["players"]):
            r["turn"] = "dealer"

            while get_val(r["dealer_hand"]) < 17:
                if r["shoe"]:
                    r["dealer_hand"].append(r["shoe"].pop(0))
                else:
                    break

            dealer_score = get_val(r["dealer_hand"])

            for player in r["players"]:
                if player not in r["bets"]:
                    continue

                bet = r["bets"][player]
                hands = r["hands"][player]

                if not isinstance(hands[0], list):
                    hands = [hands]

                for hand in hands:

                    score = get_val(hand)

                    if score > 21:
                        continue

                    elif dealer_score > 21:
                        r["chips"][player] += bet * 2
                        update_player_chips(player, r["chips"][player])

                    elif score > dealer_score:
                        r["chips"][player] += bet * 2
                        update_player_chips(player, r["chips"][player])

                    elif score == dealer_score:
                        r["chips"][player] += bet
                        update_player_chips(player, r["chips"][player])

    if action == "split":

        hand = r["hands"][player_name]

        if isinstance(hand[0], list) or not can_split(hand):
            return {"error": "Cannot split"}, 400

        bet = r["bets"][player_name]

        if r["chips"][player_name] < bet:
            return {"error": "Not enough chips"}, 400

        r["chips"][player_name] -= bet
        update_player_chips(player_name, r["chips"][player_name])

        card1 = hand[0]
        card2 = hand[1]

        r["hands"][player_name] = [
            [card1, r["shoe"].pop(0)],
            [card2, r["shoe"].pop(0)],
        ]

        r.setdefault("split_turn", {})
        r["split_turn"][player_name] = 0

    return {"ok": True}


@app.route("/join-room", methods=["POST"])
def join_room():
    data = request.json
    room = data["room"]
    player_name = data.get("player", "Player")

    if room not in rooms:
        return {"error": "Room not found"}, 404

    player = save_player(player_name)

    rooms[room]["players"].append(player_name)
    rooms[room]["chips"][player_name] = player["chips"]

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
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
