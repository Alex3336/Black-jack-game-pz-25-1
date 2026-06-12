import React from 'react';
import './App.css';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  return (
    <div className="App">
      <h1>Гра в Black Jack</h1>
      <div className="game-board">
        <button onClick={() => console.log('Взяти карту')}>Взяти карту</button>
        <button onClick={() => console.log('Досить')}>Досить</button>
      </div>
    </div>
  );
}

export default App;
