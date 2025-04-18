import { useState, useEffect } from "react";
import "./styles.css";

const API_URL = "https://ticbackend.azurewebsites.net"; // Replace with your deployed endpoint

function Square({ value, onSquareClick }) {
  return <button className="square" onClick={onSquareClick}>{value}</button>;
}

function Board({ xIsNext, squares, onPlay }) {
  function handleClick(i) {
    if (calculateWinner(squares) || squares[i]) return;
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    onPlay(nextSquares);
  }

  const winner = calculateWinner(squares);
  const status = winner ? "Winner: " + winner : "Next player: " + (xIsNext ? "X" : "O");

  return (
    <>
      <div className="status">{status}</div>
      {[0, 3, 6].map((i) => (
        <div className="board-row" key={i}>
          {[0, 1, 2].map((j) => (
            <Square key={i + j} value={squares[i + j]} onSquareClick={() => handleClick(i + j)} />
          ))}
        </div>
      ))}
    </>
  );
}

export default function App() {
  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const currentSquares = history[currentMove];
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    const playerId = crypto.randomUUID();
    fetch(`${API_URL}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    })
      .then(res => res.json())
      .then(data => {
        setPlayerSymbol(data.symbol);
        if (data.roomId) setRoomId(data.roomId); // Ensure this is set here
      })
      .catch(err => alert(err.message));
  }, []); // Make sure this runs only once on mount

  useEffect(() => {
    const interval = setInterval(() => {
      if (roomId) {
        fetch(`${API_URL}/state/${roomId}`)
          .then(res => res.json())
          .then(board => {
            if (JSON.stringify(board) !== JSON.stringify(currentSquares)) {
              handlePlayFromServer(board);
            }
          });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [roomId, currentSquares]);

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setXIsNext(!xIsNext);

    if (roomId) {
      fetch(`${API_URL}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, board: nextSquares, playerId: playerSymbol }),
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || "Something went wrong"); });
        }
      })
      .catch(error => {
        alert(error.message); // Display the error to the user
      });
    }
  }

  function handlePlayFromServer(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  function handleReset() {
    setHistory([Array(9).fill(null)]);
    setCurrentMove(0);
    setXIsNext(true);
  }

  function jumpTo(move) {
    setCurrentMove(move);
    setXIsNext(move % 2 === 0);
  }

  const moves = history.map((squares, move) => move > 0 && (
    <li key={move}>
      <button className="Hbutton" onClick={() => jumpTo(move)}>
        Go to move #{move}
      </button>
    </li>
  ));

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <p>You are: <strong>{playerSymbol || "Waiting..."}</strong></p>
        {currentMove > 0 && <button className="reset-button" onClick={handleReset}>Reset</button>}
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
