import React, { useState, useEffect } from "react";
import type { MyComponentProps } from "./join_room";
import PlayerCards, { Card, createShoe, getCards, calculateHandValue } from "./player_cards";

export interface BlackJackProps {
	role: MyComponentProps["userRole"];
}

export default function BlackJack({ role }: BlackJackProps) {
	const [shoe, setShoe] = useState<Card[]>([]);
	const [playerHand, setPlayerHand] = useState<Card[]>([]);
	const [dealerHand, setDealerHand] = useState<Card[]>([]);
	const [loading, setLoading] = useState(true);
	const [isPlayerTurn, setIsPlayerTurn] = useState(true);

	useEffect(() => {
		async function initGame() {
			const deck = await getCards();
			const newShoe = createShoe(deck);
			
			// Роздаємо по 2 карти кожному з однієї колоди
			const pHand = newShoe.slice(0, 2);
			const dHand = newShoe.slice(2, 4);
			const remainingShoe = newShoe.slice(4);
			
			setShoe(remainingShoe);
			setPlayerHand(pHand);
			setDealerHand(dHand);
			setLoading(false);
		}
		initGame();
	}, []);

	const handleHit = () => {
		if (!isPlayerTurn || shoe.length === 0) return;

		const newCard = shoe[0];
		const newShoe = shoe.slice(1);
		const newHand = [...playerHand, newCard];

		setPlayerHand(newHand);
		setShoe(newShoe);

		// Перевірка на перебір балів
		if (calculateHandValue(newHand) > 21) {
			setIsPlayerTurn(false);
			alert("Перебір! Ви програли.");
		}
	};

	const handleStand = () => {
		setIsPlayerTurn(false);
		alert("Хід завершено. Очікуйте результатів ділера.");
		// Тут можна додати автоматичний хід ділера (AI)
	};

	const canPlay = role === "guest" && isPlayerTurn;

	if (loading) return <div>Ініціалізація спільної колоди...</div>;

	return (
		<div>
			<h1>Чорний Джек</h1>
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

			<div>
				<button onClick={handleHit} disabled={!canPlay}>Взяти карту</button>
				<button onClick={handleStand} disabled={!canPlay}>Досить</button>
			</div>
		</div>
	);
}
