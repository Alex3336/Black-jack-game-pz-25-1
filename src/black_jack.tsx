import React from "react";
import type { MyComponentProps } from "./join_room";
import PlayerCards from "./player_cards";

export interface BlackJackProps {
	role: MyComponentProps["userRole"];
}

export default function BlackJack({ role }: BlackJackProps) {
	return (
		<div>
			<h1>Чорний Джек</h1>
			<p>
				Ви граєте як: <strong>{role === "host" ? "Ділер" : "Гравець"}</strong>
			</p>

			<div>
				<h2>Карти Ділера</h2>
				<PlayerCards role="host" />
			</div>

			<div>
				<h2>Ваші карти</h2>
				<PlayerCards role="guest" />
			</div>

			<div>
				<button>Взяти карту</button>
				<button>Досить</button>
			</div>
		</div>
	);
}
