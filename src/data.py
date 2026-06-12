import json
import os
from flask import Flask, jsonify, redirect, url_for

app = Flask(__name__)

base_path = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(base_path, "cards.json")

if os.path.exists(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        cards = json.load(f)
else:
    print(f"Попередження: Файл не знайдено за шляхом {json_path}. Створюємо порожній список.")
    cards = []

@app.route("/")
def index():
    return redirect(url_for("get_cards"))


@app.route("/cards", methods=["GET"])
def get_cards():
    return jsonify(cards)


if __name__ == "__main__":
    app.run(debug=True)
