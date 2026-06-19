import React, { useState, useEffect } from "react";
import type { MyComponentProps } from "./join_room";
import PlayerCards, { Card, calculateHandValue } from "./player_cards";

export interface BlackJackProps {
	role: MyComponentProps["userRole"];
	roomCode: string;
	player: string;
}
type Hand = Card[] | Card[][];

interface RoomStatusResponse {
	started: boolean;
	hands: Record<string, Hand>;
	dealer_hand: Card[];
	turn: "player" | "dealer";
	current_player: string | null;
	status: string;
	chips?: Record<string, number>;
	bets?: Record<string, number>;
}

const API_BASE =
	window.location.hostname === "localhost" ? "http://localhost:5000" : "";
const ACTION_URL = `${API_BASE}/game-action`;
const STATUS_URL = `${API_BASE}/room-status`;
const START_GAME_URL = `${API_BASE}/start-game`;
const PLAYER_CHIPS_URL = `${API_BASE}/player-chips`;
const PLACE_BET_URL = `${API_BASE}/place-bet`;

export default function BlackJack({ role, roomCode, player }: BlackJackProps) {
	const [hands, setHands] = useState<Record<string, Hand>>({});
	const [dealerHand, setDealerHand] = useState<Card[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPlayer, setCurrentPlayer] = useState<string | null>("");
	const [turnType, setTurnType] = useState<"player" | "dealer">("player");
	const [chips, setChips] = useState<Record<string, number>>({});
	const [bets, setBets] = useState<Record<string, number>>({});
	const [betAmount, setBetAmount] = useState(50);
	const [betError, setBetError] = useState("");
	const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);

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
					setChips(data.chips || {});
					setBets(data.bets || {});
					setLoading(false);
				}
			} catch (e) {
				console.error("Помилка синхронізації:", e);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [roomCode]);

	useEffect(() => {
		async function loadPlayerChips() {
			try {
				const response = await fetch(PLAYER_CHIPS_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ room: roomCode, player }),
				});
				const data = await response.json();

				if (response.ok) {
					setChips((current) => ({ ...current, [player]: data.chips }));
					setBets((current) => ({ ...current, [player]: data.bet }));
				}
			} catch (e) {
				console.error("Не вдалося отримати фішки:", e);
			}
		}

		loadPlayerChips();
	}, [roomCode, player]);

	const sendAction = async (action: "hit" | "stand" | "split") => {
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
		const myHand = hands[player];
		if (
			Array.isArray(myHand) &&
			!Array.isArray(myHand[0]) &&
			calculateHandValue(myHand as Card[]) > 21
		) {
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

	const placeBet = async () => {
		setBetError("");

		try {
			const response = await fetch(PLACE_BET_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ room: roomCode, player, bet: betAmount }),
			});
			const data = await response.json();

			if (!response.ok) {
				setBetError(data.error || "Не вдалося зробити ставку");
				return;
			}

			setChips((current) => ({ ...current, [player]: data.chips }));
			setBets((current) => ({ ...current, [player]: data.bet }));
		} catch (e) {
			setBetError("Сервер недоступний");
		}
	};

	const isPlayerTurn = turnType === "player";
	const hasBet = (bets[player] || 0) > 0;
	const canPlay = isPlayerTurn && currentPlayer === player && hasBet;

	const dealerScore = calculateHandValue(dealerHand);
	const isGameOver = turnType === "dealer";
	const playerNames = Object.keys(hands);
	const selectedPlayerName = playerNames[selectedPlayerIndex] || player;
	const selectedPlayerHand = hands[selectedPlayerName] || [];
	const isSplit =
		Array.isArray(selectedPlayerHand) &&
		selectedPlayerHand.length > 0 &&
		Array.isArray(selectedPlayerHand[0]);
	const selectedPlayerHasBet = (bets[selectedPlayerName] || 0) > 0;
	const maxBet = chips[player] || 0;

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

			<div className="game-table__bet-panel">
				<div className="game-table__bet-info">
					<span>Фішки: {chips[player] ?? 0}</span>
					<span>Ваша ставка: {bets[player] ?? 0}</span>
				</div>
				<div className="game-table__bet-controls">
					<input
						className="game-table__bet-input"
						type="number"
						min={1}
						max={maxBet}
						value={betAmount}
						onChange={(e) => setBetAmount(Number(e.target.value))}
						disabled={isGameOver || hasBet}
					/>
					<button
						onClick={placeBet}
						disabled={
							isGameOver ||
							hasBet ||
							maxBet <= 0 ||
							betAmount <= 0 ||
							betAmount > maxBet
						}
						className="game-table__btn game-table__btn--bet">
						Поставити
					</button>
				</div>
				{betError && <p className="game-table__bet-error">{betError}</p>}
			</div>

			<div className="game-table__section game-table__section--dealer">
				<h3 className="game-table__section-title">Карти Дилера</h3>
				{hasBet ? (
					<PlayerCards
						hand={dealerHand}
						hideFirstCard={turnType === "player"}
					/>
				) : (
					<p className="game-table__locked-cards">Спочатку зробіть ставку</p>
				)}
			</div>

			<div className="game-table__section game-table__section--player">
				<h3 className="game-table__section-title">Ваші карти ({player})</h3>
				{hasBet ? (
					Array.isArray(hands[player]?.[0]) ? (
						(hands[player] as Card[][]).map((hand, i) => (
							<div key={i}>
								<h4>Рука {i + 1}</h4>
								<PlayerCards hand={hand} />
							</div>
						))
					) : (
						<PlayerCards hand={(hands[player] as Card[]) || []} />
					)
				) : (
					<p className="game-table__locked-cards">
						Карти відкриються після ставки
					</p>
				)}
			</div>

			{playerNames.length > 1 && (
				<div className="game-table__section game-table__section--viewer">
					<h3 className="game-table__section-title">
						Карти гравця: {selectedPlayerName}
					</h3>
					<input
						className="game-table__player-slider"
						type="range"
						min={0}
						max={playerNames.length - 1}
						value={selectedPlayerIndex}
						onChange={(e) => setSelectedPlayerIndex(Number(e.target.value))}
					/>
					<div className="game-table__viewer-meta">
						<span>Фішки: {chips[selectedPlayerName] ?? 0}</span>
						<span>Ставка: {bets[selectedPlayerName] ?? 0}</span>
					</div>
					{selectedPlayerHasBet ? (
						isSplit ? (
							selectedPlayerHand.map((hand, i) => (
								<div key={i}>
									<h4>Рука {i + 1}</h4>
									<PlayerCards hand={hand as Card[]} />
								</div>
							))
						) : (
							<PlayerCards hand={selectedPlayerHand as Card[]} />
						)
					) : (
						<p className="game-table__locked-cards">
							Цей гравець ще не зробив ставку
						</p>
					)}
				</div>
			)}

			{isGameOver && (
				<div className="game-table__results">
					<h3 className="game-table__results-title">Підсумки раунду:</h3>
					{Object.entries(hands).map(([name, hand]) => {
						const score = Array.isArray(hand?.[0])
							? Math.max(
									...(hand as Card[][]).map((h) => calculateHandValue(h)),
								)
							: calculateHandValue(hand as Card[]);

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
				<button
					onClick={() => sendAction("split")}
					disabled={
						!canPlay ||
						Array.isArray(hands[player]?.[0]) ||
						(hands[player] as Card[])?.length !== 2 ||
						(hands[player] as Card[])[0]?.value !==
							(hands[player] as Card[])[1]?.value
					}
					className="game-table__btn game-table__btn--split">
					Спліт
				</button>
				{isGameOver && role === "host" && (
					<button
						onClick={restartGame}
						className="game-table__btn game-table__btn--restart">
						Зіграти ще раз
					</button>
				)}
			</div>
		</div>
	);
}
