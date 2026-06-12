import React, { useState, useEffect } from "react";

const JOIN_URL = "/join-room";
const CREATE_URL = "/create-room";
const ROOM_STATUS_URL = "/room-status";

export default function JoinMenu() {
	const [roomCode, setRoomCode] = useState("");
	const [status, setStatus] = useState("Очікування...");
	const [isJoined, setIsJoined] = useState(false);

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
		if (data.ok) {
			setIsJoined(true);
		}
	}

	async function createRoom() {
		const response = await fetch(CREATE_URL, {
			method: "POST",
		});
		const data = await response.json();
		setRoomCode(data.room);
		setIsJoined(true);
	}

	async function checkRoomStatus() {
		if (!roomCode) return;

		const response = await fetch(ROOM_STATUS_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				room: roomCode,
			}),
		});
		const data = await response.json();
		if (data.status) {
			setStatus(data.status);
		}
	}

	return (
		<div>
			<h1>Створіть або приєднайтесь до кімнати</h1>

			{isJoined ? (
				<div>
					<p>Код кімнати: {roomCode}</p>
					<p>Статус: {status}</p>
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
