import React, { useState, useEffect } from "react";
import BlackJack from "./black_jack";

const API_BASE =
	window.location.hostname === "localhost" ? "http://localhost:5000" : "";
const JOIN_URL = `${API_BASE}/join-room`;
const CREATE_URL = `${API_BASE}/create-room`;
const ROOM_STATUS_URL = `${API_BASE}/room-status`;
const START_GAME_URL = `${API_BASE}/start-game`;
const LEAVE_ROOM_URL = `${API_BASE}/leave-room`;

export interface MyComponentProps {
	userRole: "host" | "guest" | null;
}

export default function JoinMenu() {
	const [roomCode, setRoomCode] = useState(
		localStorage.getItem("roomCode") || "",
	);

	const [playerName, setPlayerName] = useState(
		localStorage.getItem("playerName") || "",
	);

	const [isJoined, setIsJoined] = useState(
		localStorage.getItem("joined") === "true",
	);
	const [status, setStatus] = useState("Очікування...");
	const [gameStarted, setGameStarted] = useState(false);
	const [userRole, setUserRole] = useState<MyComponentProps["userRole"]>(null);

	useEffect(() => {
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
				if (data.host === playerName && userRole !== "host") {
					setUserRole("host");
					localStorage.setItem("role", "host");
				}
			} catch (error) {
				setStatus("Помилка зв'язку з сервером");
			}
		}

		if (isJoined && roomCode) {
			const interval = setInterval(() => {
				checkRoomStatus();
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [isJoined, roomCode, playerName, userRole]);

	useEffect(() => {
		const savedRoom = localStorage.getItem("roomCode");

		const savedPlayer = localStorage.getItem("playerName");

		const joined = localStorage.getItem("joined");

		if (savedRoom && savedPlayer && joined === "true") {
			setRoomCode(savedRoom);
			setPlayerName(savedPlayer);
			setIsJoined(true);

			const savedRole = localStorage.getItem(
				"role",
			) as MyComponentProps["userRole"];
			if (savedRole) {
				setUserRole(savedRole);
			}
		}
	}, []);

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
				localStorage.setItem("roomCode", roomCode);
				localStorage.setItem("playerName", playerName);
				localStorage.setItem("joined", "true");
				localStorage.setItem("role", "guest");
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

				localStorage.setItem("roomCode", data.room);
				localStorage.setItem("playerName", playerName);
				localStorage.setItem("joined", "true");
				localStorage.setItem("role", "host");
			}
		} catch (e) {
			alert("Не вдалося створити кімнату");
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

	const leaveRoom = async () => {
		try {
			await fetch(LEAVE_ROOM_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ room: roomCode, player: playerName }),
			});
		} catch (e) {
			
		}
		localStorage.clear();
		window.location.reload();
	};

	return (
		<div className="join-menu">
			{gameStarted ? (
				isJoined ? null : (
					<h1 className="join-menu__title">
						Запросіть друзів пограти у BJ за кодом нижче
					</h1>
				)
			) : (
				<h1 className="join-menu__title">
					Створіть або приєднайтесь до кімнати
				</h1>
			)}

			{gameStarted ? (
				<BlackJack role={userRole} roomCode={roomCode} player={playerName} />
			) : isJoined ? (
				<div className="join-menu__waiting-room">
					<p className="join-menu__code">
						Код кімнати: <span>{roomCode}</span>
					</p>
					<p className="join-menu__status">Статус: {status}</p>
					{status === "Кімната готова" && userRole === "host" && (
						<button
							className="join-menu__btn join-menu__btn--start"
							onClick={startGame}>
							Запустити гру для всіх
						</button>
					)}
					<button
						className="join-menu__btn join-menu__btn--leave"
						onClick={leaveRoom}>
						Вийти з кімнати
					</button>
				</div>
			) : (
				<div className="join-menu__form">
					<input
						className="join-menu__input"
						type="text"
						value={playerName}
						onChange={(e) => setPlayerName(e.target.value)}
						placeholder="Ваше ім'я"
					/>
					<input
						className="join-menu__input"
						type="text"
						value={roomCode}
						onChange={handleChange}
						placeholder="Введіть код кімнати"
					/>
					<div className="join-menu__actions">
						<button
							className="join-menu__btn join-menu__btn--join"
							onClick={joinRoom}>
							Приєднатися
						</button>
						<button
							className="join-menu__btn join-menu__btn--create"
							onClick={createRoom}>
							Створити кімнату
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
