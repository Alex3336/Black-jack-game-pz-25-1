import React, { useState, useEffect } from "react";
import type { MyComponentProps } from "./join_room";
import PlayerCards, { Card, createShoe, getCards } from "./player_cards";

export interface BlackJackProps {
	role: MyComponentProps["userRole"];
}

export default function BlackJack({ role }: BlackJackProps) {
	const [shoe, setShoe] = useState<Card[]>([]);
	const [playerHand, setPlayerHand] = useState<Card[]>([]);
	const [dealerHand, setDealerHand] = useState<Card[]>([]);
	const [loading, setLoading] = useState(true);

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

	if (loading) return <div>Ініціалізація спільної колоди...</div>;

	return (
		<div>
			<h1>Чорний Джек</h1>
			<p>
				Ви граєте як: <strong>{role === "host" ? "Ділер" : "Гравець"}</strong>
			</p>

			<div>
				<h2>Карти Ділера</h2>
				<PlayerCards 
					role="host" 
					hand={dealerHand} 
					setHand={setDealerHand} 
					shoe={shoe} 
					setShoe={setShoe} 
				/>
			</div>

			<div>
				<h2>Ваші карти</h2>
				<PlayerCards 
					role="guest" 
					hand={playerHand} 
					setHand={setPlayerHand} 
					shoe={shoe} 
					setShoe={setShoe} 
				/>
			</div>

			<div>
				<button>Взяти карту</button>
				<button>Досить</button>
			</div>
		</div>
	);
}
