import React, { useState, useEffect } from "react";
import type { BlackJackProps } from "./black_jack";

const API_BASE = "";
const API_URL = `${API_BASE}/cards`;

interface Card {
	suit: string;
	value: string;
}

export default function PlayerCards({ role }: BlackJackProps) {
	const [hand, setHand] = useState<Card[]>([]);
	const [shoe, setShoe] = useState<Card[]>([]);

	const CARD_BACK_URL =
		"https://raw.githubusercontent.com/htdebeer/SVG-cards/master/png/1x/back.png";

	function createShoe(allCards: Card[]) {
		let newShoe: Card[] = [];
		for (let i = 0; i < 4; i++) {
			newShoe = [...newShoe, ...allCards];
		}
		return newShoe.sort(() => Math.random() - 0.5);
	}

	async function getCards() {
		try {
			const response = await fetch(API_URL);
			const data = await response.json();

			const allCards = Array.isArray(data) ? data : data.cards;

			const shuffledShoe = createShoe(allCards);

			setHand(shuffledShoe.slice(0, 2));
			setShoe(shuffledShoe.slice(2));
		} catch (e) {
			console.error("Помилка завантаження карт:", e);
		}
	}

	useEffect(() => {
		getCards();
	}, []);

	if (hand.length === 0) {
		return <div>Завантаження карт...</div>;
	}

	return (
		<div>
			{hand.map((card, index) => {
				const isHidden = role === "host" && index === 1;

				return (
					<div key={index}>
						{isHidden ? (
							<img src={CARD_BACK_URL} alt="Card Back" />
						) : (
							<div>
								<div>{card.value}</div>
								<div>{card.suit}</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
