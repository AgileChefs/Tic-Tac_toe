import { useEffect, useState, useRef } from "react";
import "./styles.css";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [canReset, setCanReset] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket("ws://localhost:8080"); 
    ws.onopen = () => {
      console.log("Connected to the server");
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "init") {
        setPlayerSymbol(data.symbol);
      } 
      else if (data.type === "update") {
        setBoard(data.board);
        setTurn(data.turn);
        setWinner(data.winner);
        setWinningLine(data.winningLine || []);
        setCanReset(data.winner !== null);
      } 
      else if (data.type === "reset") {
        setBoard(Array(9).fill(null));
        setTurn("X");
        setWinner(null);
        setWinningLine([]);
        setCanReset(false);
      } 
      else if (data.type === "full") {
        alert(data.message);
      }
      else if (data.type === "chat") {
        setChatMessages((prevMessages) => [...prevMessages, data.message]);
      }
    };
    
    ws.onclose = () => {
      console.log("Disconnected from the server");
    };
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);
  
  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  function handleClick(i) {
    if (!socket || winner || board[i] !== null || turn !== playerSymbol) {
      if (turn !== playerSymbol && socket) {
        alert("It's not your turn or invalid move!");
      }
      return;
    }
    
    socket.send(JSON.stringify({
      type: "move",
      index: i
    }));
  }

  function handleReset() {
    if (socket && canReset) {
      socket.send(JSON.stringify({
        type: "reset"
      }));
    }
  }
  
  function handleSendMessage(e) {
    e.preventDefault();
    if (!socket || messageInput.trim() === "" || !playerSymbol) return;
    
    socket.send(JSON.stringify({
      type: "chat",
      text: messageInput
    }));
    
    setMessageInput("");
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
  
  const isOwnMessage = (sender) => {
    return sender === playerSymbol;
  };

  return (
    <div className="game-container">
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
      
      <div className="chat-panel">
        <h2>Game Chat</h2>
        <div className="chat-container" ref={chatContainerRef}>
          {chatMessages.length === 0 ? (
            <p className="chat-empty">No messages yet. Say hello!</p>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message-wrapper ${isOwnMessage(msg.sender) ? 'own-message' : 'other-message'}`}>
                <div className={`chat-message ${isOwnMessage(msg.sender) ? 'chat-message-own' : 'chat-message-opponent'}`}>
                  <div className="chat-header">
                    <span className="chat-sender" style={{ color: msg.sender === "X" ? "red" : "green" }}>
                      {isOwnMessage(msg.sender) ? "You" : `Player ${msg.sender}`}
                    </span>
                    <span className="chat-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="chat-text">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <form className="chat-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!playerSymbol}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!playerSymbol || messageInput.trim() === ""}
            className="chat-send-button"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}


