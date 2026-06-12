import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders learn react link", () => {
	render(<App />);
	const linkElement = screen.getByText(/Створіть або приєднайтесь до кімнати/i);
	expect(linkElement).toBeInTheDocument();
});
