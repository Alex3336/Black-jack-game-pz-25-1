import React from 'react';
import './App.css';
import JoinMenu from './join_room';



function App() {
  return (
    <div className="App">
      <JoinMenu/>
      {/* <h1>Гра в Black Jack</h1>
      <div className="game-board">
        <button onClick={() => console.log('Взяти карту')}>Взяти карту</button>
        <button onClick={() => console.log('Досить')}>Досить</button>
      </div> */}
    </div>
  );
}

export default App;
