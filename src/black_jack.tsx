import React, { useState, useEffect } from "react";
import type { MyComponentProps } from "./join_room";
import PlayerCards, { Card, calculateHandValue } from "./player_cards";

export interface BlackJackProps {
	role: MyComponentProps["userRole"];
	roomCode: string;
	player: string;
}

interface RoomStatusResponse {
	started: boolean;
	hands: Record<string, Card[]>;
	dealer_hand: Card[];
	turn: "player" | "dealer";
	current_player: string | null;
	status: string;
}

const API_BASE =
	window.location.hostname === "localhost" ? "http://localhost:5000" : "";
const ACTION_URL = `${API_BASE}/game-action`;
const STATUS_URL = `${API_BASE}/room-status`;
const START_GAME_URL = `${API_BASE}/start-game`;

export default function BlackJack({ role, roomCode, player }: BlackJackProps) {
	const [hands, setHands] = useState<Record<string, Card[]>>({});
	const [dealerHand, setDealerHand] = useState<Card[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPlayer, setCurrentPlayer] = useState<string | null>("");
	const [turnType, setTurnType] = useState<"player" | "dealer">("player");

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const response = await fetch(STATUS_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ room: roomCode }),
				});
				const data: RoomStatusResponse = await response.json();
				if (data.started) {
					setHands(data.hands);
					setDealerHand(data.dealer_hand);
					setCurrentPlayer(data.current_player);
					setTurnType(data.turn);
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
				body: JSON.stringify({ room: roomCode, action, player }),
			});
		} catch (e) {
			alert("Помилка дії");
		}
	};

	const handleHit = () => {
		if (currentPlayer !== player) return;
		sendAction("hit");
		const myHand = hands[player] || [];
		if (calculateHandValue(myHand) > 21) {
			alert("Перебір!");
		}
	};

	const handleStand = () => {
		sendAction("stand");
	};

	const restartGame = async () => {
		try {
			await fetch(START_GAME_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ room: roomCode }),
			});
		} catch (e) {
			alert("Не вдалося почати нову гру");
		}
	};

	const isPlayerTurn = turnType === "player";
	const canPlay = isPlayerTurn && currentPlayer === player;

	const dealerScore = calculateHandValue(dealerHand);
	const isGameOver = turnType === "dealer";

	if (loading) return <div>Синхронізація з сервером...</div>;

	return (
		<div className="game-table">
			<h1 className="game-table__title">Кімната: {roomCode}</h1>
			<p className="game-table__user-info">
				Ви: {player} ({role === "host" ? "Організатор" : "Гість"})
			</p>
			<p className="game-table__turn-indicator">
				{isPlayerTurn ? `Зараз черга: ${currentPlayer}` : "Хід дилера..."}
			</p>

			<div className="game-table__section game-table__section--dealer">
				<h3 className="game-table__section-title">Карти Дилера</h3>
				<PlayerCards hand={dealerHand} hideFirstCard={turnType === "player"} />
			</div>

			<div className="game-table__section game-table__section--player">
				<h3 className="game-table__section-title">Ваші карти ({player})</h3>
				<PlayerCards hand={hands[player] || []} />
			</div>

			{isGameOver && (
				<div className="game-table__results">
					<h3 className="game-table__results-title">Підсумки раунду:</h3>
					{Object.entries(hands).map(([name, hand]) => {
						const score = calculateHandValue(hand);
						let result = "";
						if (score > 21) result = "loss";
						else if (dealerScore > 21) result = "win";
						else if (score > dealerScore) result = "win";
						else if (score < dealerScore) result = "loss";
						else result = "push";

						return (
							<p
								key={name}
								className={`game-table__result-item game-table__result-item--${result}`}>
								<strong>{name}:</strong> {score} очок — {result.toUpperCase()}
							</p>
						);
					})}
					<p className="game-table__dealer-info">
						<strong>Ділер:</strong> {dealerScore} очок
					</p>

					{role === "host" && (
						<button onClick={restartGame} className="btn-restart">
							Зіграти ще раз
						</button>
					)}
				</div>
			)}

			<div className="game-table__controls">
				<button
					onClick={handleHit}
					disabled={!canPlay}
					className="game-table__btn game-table__btn--hit">
					Взяти карту
				</button>
				<button
					onClick={handleStand}
					disabled={!canPlay}
					className="game-table__btn game-table__btn--stand">
					Досить
				</button>
			</div>
		</div>
	);
}
