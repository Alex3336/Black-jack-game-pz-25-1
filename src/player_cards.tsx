import React from "react";

const API_BASE =
	window.location.hostname === "localhost" ? "http://localhost:5000" : "";
const API_URL = `${API_BASE}/cards`;

export interface Card {
	image: string;
	name: string;
	value: number | number[];
}

interface PlayerCardsProps {
	hand: Card[];
	hideFirstCard?: boolean;
}

export const calculateHandValue = (cards: Card[]) => {
	let total = 0;
	let aces = 0;

	cards.forEach((card) => {
		if (Array.isArray(card.value)) {
			total += 11;
			aces += 1;
		} else {
			total += card.value as number;
		}
	});

	while (total > 21 && aces > 0) {
		total -= 10;
		aces -= 1;
	}

	return total;
};

export async function getCards() {
	const response = await fetch(`${API_URL}`, { method: "GET" });
	const data: Card[] = await response.json();
	return data.filter((card, index) => index < data.length - 1);
}

export function createShoe(cardDeck: Card[]) {
	const shoes: Card[] = [];
	cardDeck.forEach((card) => {
		for (let i = 0; i < 4; i++) shoes.push(card);
	});
	for (let i = shoes.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shoes[i], shoes[j]] = [shoes[j], shoes[i]];
	}
	return shoes;
}

export default function PlayerCards({ hand, hideFirstCard }: PlayerCardsProps) {
	const visibleCards = hand.filter((_, i) => !(hideFirstCard && i === 1));
	const score = calculateHandValue(visibleCards);

	return (
		<div>
			<div style={{ display: "flex", gap: "10px" }}>
				{hand.map((card, i) => {
					const isHidden = hideFirstCard && i === 1;
					return (
						<img
							key={i}
							src={
								isHidden ? "/playing_cards/card_back.png" : card.image
							}
							alt={isHidden ? "Сорочка карти" : card.name}
							style={{ width: "100px" }}
						/>
					);
				})}
			</div>
			<p>Очки: {hideFirstCard ? `${score} + ?` : score}</p>
		</div>
	);
}
