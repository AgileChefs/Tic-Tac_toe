import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./styles.css";

const socket = io("https://tictactoebackend.webpubsub.azure.com", {
  path: "/clients/socketio/hubs/Hub",
});

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    socket.on("init", (data) => {
      setPlayerSymbol(data.symbol);
    });

    socket.on("update", (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setWinner(data.winner);
      setWinningLine(data.winningLine || []);
      setCanReset(data.winner !== null);
    });

    socket.on("reset", () => {
      setBoard(Array(9).fill(null));
      setTurn("X");
      setWinner(null);
      setWinningLine([]);
      setCanReset(false);
    });

    socket.on("full", (msg) => {
      alert(msg);
    });
  }, []);

  function handleClick(i) {
    if (winner || board[i] !== null || turn !== playerSymbol) {
      alert("It's not your turn or invalid move!");
      return;
    }
    socket.emit("move", i);
  }

  function handleReset() {
    if (canReset) {
      socket.emit("reset");
    }
  }

  const renderSquare = (i) => {
    const value = board[i];
    const style = {
      color: value === "X" ? "red" : value === "O" ? "green" : "black",
      backgroundColor: winningLine.includes(i) ? "#baffc9" : "white",
    };
    return (
      <button key={i} className="square" onClick={() => handleClick(i)} style={style}>
        {value}
      </button>
    );
  };

  return (
    <div className="game">
      <h1>Tic Tac Toe</h1>
      {playerSymbol && <p>You are <strong style={{ color: playerSymbol === "X" ? "red" : "green" }}>{playerSymbol}</strong></p>}
      {winner ? (
        <h2 style={{ color: "purple" }}>Winner: {winner}</h2>
      ) : (
        <h2>Turn: {turn}</h2>
      )}
      <div className="board">
        {[0, 3, 6].map((row) => (
          <div key={row} className="board-row">
            {[0, 1, 2].map((col) => renderSquare(row + col))}
          </div>
        ))}
      </div>
      <button
        className="reset-button"
        onClick={handleReset}
        disabled={!canReset}
      >
        Reset Game
      </button>
    </div>
  );
}
