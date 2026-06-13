import React, { useState, useEffect } from "react";
import BlackJack from "./black_jack";

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
const JOIN_URL = `${API_BASE}/join-room`;
const CREATE_URL = `${API_BASE}/create-room`;
const ROOM_STATUS_URL = `${API_BASE}/room-status`;
const START_GAME_URL = `${API_BASE}/start-game`;

export interface MyComponentProps {
	userRole: "host" | "guest" | null;
}

export default function JoinMenu() {
	const [roomCode, setRoomCode] = useState("");
	const [playerName, setPlayerName] = useState("");
	const [status, setStatus] = useState("Очікування...");
	const [isJoined, setIsJoined] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);
	const [userRole, setUserRole] = useState<MyComponentProps["userRole"]>(null);

	useEffect(() => {
		if (isJoined && roomCode) {
			const interval = setInterval(() => {
				checkRoomStatus();
			}, 5000);

			return () => clearInterval(interval);
		}
	}, [isJoined, roomCode]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRoomCode(event.target.value);
	};

	async function joinRoom() {
		if (!playerName.trim()) {
			alert("Будь ласка, введіть ім'я");
			return;
		}
		try {
			const response = await fetch(JOIN_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					room: roomCode,
					player: playerName,
				}),
			});

			const data = await response.json();
			if (response.ok) {
				setIsJoined(true);
				setUserRole("guest");
			} else {
				alert(data.error || "Помилка приєднання");
			}
		} catch (e) {
			alert("Сервер недоступний");
		}
	}

	async function createRoom() {
		if (!playerName.trim()) {
			alert("Будь ласка, введіть ім'я");
			return;
		}
		try {
			const response = await fetch(CREATE_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					player: playerName,
				}),
			});
			const data = await response.json();
			if (response.ok) {
				setRoomCode(data.room);
				setIsJoined(true);
				setUserRole("host");
			}
		} catch (e) {
			alert("Не вдалося створити кімнату");
		}
	}

	async function checkRoomStatus() {
		if (!roomCode) return;

		try {
			const response = await fetch(ROOM_STATUS_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					room: roomCode,
				}),
			});

			if (!response.ok) {
				throw new Error("Кімнату не знайдено");
			}

			const data = await response.json();
			if (data.started) {
				setGameStarted(true);
			} else if (data.status) {
				setStatus(data.status);
			}
		} catch (error) {
			setStatus("Помилка зв'язку з сервером");
		}
	}

	async function startGame() {
		try {
			await fetch(START_GAME_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					room: roomCode,
				}),
			});
		} catch (e) {
			alert("Не вдалося почати гру");
		}
	}

	return (
		<div>
			<h1>Створіть або приєднайтесь до кімнати</h1>

			{gameStarted ? (
				<BlackJack role={userRole} />
			) : isJoined ? (
				<div>
					<p>Код кімнати: {roomCode}</p>
					<p>Статус: {status}</p>
					{status === "Кімната готова" && userRole === "host" && (
						<button onClick={startGame}>Запустити гру для всіх</button>
					)}
				</div>
			) : (
				<div>
					<input
						type="text"
						value={playerName}
						onChange={(e) => setPlayerName(e.target.value)}
						placeholder="Ваше ім'я"
					/>
					<br />
					<input
						type="text"
						value={roomCode}
						onChange={handleChange}
						placeholder="Введіть код кімнати"
					/>
					<button onClick={joinRoom}>Приєднатися до кімнати</button>
					<button onClick={createRoom}>Створити кімнату</button>
				</div>
			)}
		</div>
	);
}
