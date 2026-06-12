import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Гра в Black Jack</h1>
      <div className="game-board">
        {/* Тут буде ваша логіка гри */}
        <button onClick={() => console.log('Взяти карту')}>Взяти карту</button>
        <button onClick={() => console.log('Досить')}>Досить</button>
      </div>
    </div>
  );
}

export default App;
