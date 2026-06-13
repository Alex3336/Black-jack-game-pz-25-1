import React, { useState, useEffect } from "react";
import type { MyComponentProps } from "./join_room";
import PlayerCards, { Card, calculateHandValue } from "./player_cards";

export interface BlackJackProps {
	role: MyComponentProps["userRole"];
	roomCode: string;
}

const API_BASE =
	window.location.hostname === "localhost" ? "http://localhost:5000" : "";
const ACTION_URL = `${API_BASE}/game-action`;
const STATUS_URL = `${API_BASE}/room-status`;

export default function BlackJack({ role, roomCode }: BlackJackProps) {
	const [playerHand, setPlayerHand] = useState<Card[]>([]);
	const [dealerHand, setDealerHand] = useState<Card[]>([]);
	const [loading, setLoading] = useState(true);
	const [isPlayerTurn, setIsPlayerTurn] = useState(true);

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const response = await fetch(STATUS_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ room: roomCode }),
				});
				const data = await response.json();
				if (data.started) {
					setPlayerHand(data.player_hand);
					setDealerHand(data.dealer_hand);
					setIsPlayerTurn(data.turn === "player");
					setLoading(false);
				}
			} catch (e) {
				console.error("Помилка синхронізації:", e);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [roomCode]);

	const sendAction = async (action: "hit" | "stand") => {
		try {
			await fetch(ACTION_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ room: roomCode, action }),
			});
		} catch (e) {
			alert("Помилка дії");
		}
	};

	const handleHit = () => {
		if (!isPlayerTurn) return;
		sendAction("hit");
		if (calculateHandValue(playerHand) > 21) {
			alert("Перебір!");
		}
	};

	const handleStand = () => {
		sendAction("stand");
	};

	const canPlay = role === "guest" && isPlayerTurn;
	const playerScore = calculateHandValue(playerHand);
	const dealerScore = calculateHandValue(dealerHand);

	// Перевірка кінця гри (коли не хід гравця)
	const isGameOver = !isPlayerTurn;

	if (loading) return <div>Синхронізація з сервером...</div>;

	return (
		<div>
			<h1>user</h1>
			<p>
				Ви граєте як: <strong>{role === "host" ? "Ділер" : "Гравець"}</strong>
			</p>

			<div>
				<h2>Карти Ділера</h2>
				<PlayerCards hand={dealerHand} hideFirstCard={isPlayerTurn} />
			</div>

			<div>
				<h2>Ваші карти</h2>
				<PlayerCards hand={playerHand} />
			</div>

			{isGameOver && (
				<div style={{ margin: "20px", padding: "10px", border: "1px solid red" }}>
					<h3>Результат:</h3>
					{playerScore > 21 ? "Перебір! Ви програли." : 
					 dealerScore > 21 ? "Ділер перебрав! Ви виграли!" : 
					 playerScore > dealerScore ? "Ви виграли!" : "Ділер виграв!"}
				</div>
			)}

			<div>
				<button onClick={handleHit} disabled={!canPlay}>
					Взяти карту
				</button>
				<button onClick={handleStand} disabled={!canPlay}>
					Досить
				</button>
			</div>
		</div>
	);
}
