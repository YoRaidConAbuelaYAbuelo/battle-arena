import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface ArenaProps {
  userId: number;
  gameId: number;
  onBack: () => void; 
}

const Arena: React.FC<ArenaProps> = ({ userId, gameId, onBack }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [message, setMessage] = useState("Inicjalizacja...");

  const refreshStatus = async () => {
    try {
      const data = await api.getGameStatus(gameId);
      setGameState(data.state);
      setGameInfo(data.game);
      if (data.game.status === 'finished') {
        setMessage(data.game.winner_id === userId ? "🏆 YOU WON!!!" : "💀 YOU LOSE...");
      } else if (message !== "REMIS") {
        const isP1 = data.game.player1_id === userId;
        const myAct = isP1 ? data.state.player1_action : data.state.player2_action;
        setMessage(myAct ? "Wait for enemy action..." : "Your Turn!");
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    refreshStatus();
    const inv = setInterval(refreshStatus, 2000);
    return () => clearInterval(inv);
  }, [gameId]);

  const handleMove = async (move: 'attack' | 'rev_up') => {
    try {
      const res = await api.sendAction(gameId, userId, move);
      if (res.message === "REMIS") setMessage("REMIS");
      else setMessage(res.message);
      refreshStatus();
    } catch (err) { console.error(err); }
  };

  if (!gameState || !gameInfo) return <div>Ładowanie...</div>;

  const myAcc = gameInfo.player1_id === userId ? parseFloat(gameState.player1_accuracy) : parseFloat(gameState.player2_accuracy);

  return (
    <div style={{ padding: '20px', border: '3px solid #333', borderRadius: '15px', maxWidth: '600px', margin: 'auto', textAlign: 'center', background: '#fff' }}>
      <h2 style={{ color: message === "REMIS" ? "#f0ad4e" : "#333" }}>{message === "REMIS" ? "💥 REMIS W RUNDZIE 💥" : `MECZ #${gameId}`}</h2>
      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{gameInfo.player1_score} : {gameInfo.player2_score}</div>
      <p style={{ fontWeight: 'bold', color: '#d9534f' }}>{message}</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
        {[1, 2].map(p => (
          <div key={p} style={{ flex: 1 }}>
            <p><b>{p === 1 ? gameInfo.p1_name : gameInfo.p2_name}</b> {gameInfo[`player${p}_id`] === userId && "(Ty)"}</p>
            <div style={{ width: '100%', height: '20px', background: '#eee', border: '1px solid #ccc', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${gameState[`player${p}_hp`]}%`, height: '100%', background: gameState[`player${p}_hp`] > 30 ? '#4caf50' : '#f44336', transition: 'width 0.5s' }} />
            </div>
            <p>HP: {gameState[`player${p}_hp`]}</p>
            <small>Celność: {(parseFloat(gameState[`player${p}_accuracy`]) * 100).toFixed(0)}%</small>
          </div>
        ))}
      </div>

      <hr style={{ margin: '20px 0' }} />
      
      {gameInfo.status === 'active' && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => handleMove('attack')} style={btnStyle}>ATAKUJ</button>
          <button onClick={() => handleMove('rev_up')} disabled={myAcc >= 0.8} style={{...btnStyle, background: myAcc >= 0.8 ? '#ccc' : '#5bc0de'}}>REV UP (+10%)</button>
        </div>
      )}

      {gameInfo.status === 'finished' && <button onClick={onBack} style={{...btnStyle, background: '#28a745', marginTop: '10px'}}>WRÓĆ DO MENU</button>}
    </div>
  );
};

const btnStyle = { padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold' as const, border: 'none', borderRadius: '8px', color: 'white', background: '#f0ad4e' };
export default Arena;