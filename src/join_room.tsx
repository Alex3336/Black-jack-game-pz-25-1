import React, { useState, useEffect } from "react";
import BlackJack from "./black_jack";

const API_BASE = ""; 
const JOIN_URL = `${API_BASE}/join-room`;
const CREATE_URL = `${API_BASE}/create-room`;
const ROOM_STATUS_URL = `${API_BASE}/room-status`;

export default function JoinMenu() {
	const [roomCode, setRoomCode] = useState("");
	const [status, setStatus] = useState("Очікування...");
	const [isJoined, setIsJoined] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);

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
		try {
			const response = await fetch(JOIN_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					room: roomCode,
				}),
			});

			const data = await response.json();
			if (response.ok) {
				setIsJoined(true);
			} else {
				alert(data.error || "Помилка приєднання");
			}
		} catch (e) {
			alert("Сервер недоступний");
		}
	}

	async function createRoom() {
		try {
			const response = await fetch(CREATE_URL, {
				method: "POST",
			});
			const data = await response.json();
			if (response.ok) {
				setRoomCode(data.room);
				setIsJoined(true);
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
			if (data.status) {
				setStatus(data.status);
			}
		} catch (error) {
			setStatus("Помилка зв'язку з сервером");
		}
	}

	return (
		<div>
			<h1>Створіть або приєднайтесь до кімнати</h1>

			{gameStarted ? (
				<BlackJack />
			) : isJoined ? (
				<div>
					<p>Код кімнати: {roomCode}</p>
					<p>Статус: {status}</p>
					{status === "Гра почалася!" && (
						<button onClick={() => setGameStarted(true)}>Запустити гру</button>
					)}
				</div>
			) : (
				<div>
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
