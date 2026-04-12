import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface ArenaProps {
  userId: number;
  gameId: number;
}

const Arena: React.FC<ArenaProps> = ({ userId, gameId }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [message, setMessage] = useState("Inicjalizacja areny...");
  const myAccuracy = gameState && gameInfo 
    ? (gameInfo.player1_id === userId ? parseFloat(gameState.player1_accuracy) : parseFloat(gameState.player2_accuracy))
    : 0.2;
    const isRevUpMaxed = myAccuracy >= 0.8;
  // 1. POLLING - Pobieranie stanu gry co 2 sekundy
  const refreshStatus = async () => {
    try {
      const data = await api.getGameStatus(gameId);
      setGameState(data.state);
      setGameInfo(data.game);

      if (data.game.status === 'waiting') {
        setMessage("Oczekiwanie na przeciwnika...");
      } else if (data.game.status === 'finished') {
        const isWinner = data.game.winner_id === userId;
        setMessage(isWinner ? "🏆 MECZ WYGRANY! Gratulacje!" : "💀 MECZ PRZEGRANY... Trenuj dalej!");
      } else {
        // Logika sprawdzania czyja tura
        const isP1 = data.game.player1_id === userId;
        const myAction = isP1 ? data.state.player1_action : data.state.player2_action;
        
        if (myAction) {
          setMessage("Czekaj na ruch przeciwnika...");
        } else {
          setMessage("Twoja tura! Wybierz akcję:");
        }
      }
    } catch (err) {
      console.error("Błąd synchronizacji:", err);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 2000); 
    return () => clearInterval(interval);
  }, [gameId]);

  // 2. Automatyczny powrót do lobby po 5 sekundach od statusu 'finished'
  useEffect(() => {
    if (gameInfo?.status === 'finished') {
      const timer = setTimeout(() => {
        window.location.reload(); 
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameInfo?.status]);

  const handleMove = async (move: 'attack' | 'rev_up') => {
    try {
      const result = await api.sendAction(gameId, userId, move);
      setMessage(result.message);
      refreshStatus(); // Natychmiastowe odświeżenie po kliknięciu
    } catch (err) {
      console.error("Błąd wysyłania akcji:", err);
    }
  };

  if (!gameState || !gameInfo) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Ładowanie danych z serwera...</div>;

  // Obliczanie czy przycisk REV UP powinien być zablokowany (max 80%)
  const myAcc = gameInfo.player1_id === userId 
    ? parseFloat(gameState.player1_accuracy) 
    : parseFloat(gameState.player2_accuracy);
  const isMaxAcc = myAcc >= 0.8;

  return (
    <div style={{ padding: '20px', border: '3px solid #333', borderRadius: '15px', maxWidth: '650px', margin: 'auto', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '5px' }}>ARENA (Mecz #{gameId})</h2>
      
      {/* Tablica Wyników */}
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
        {gameInfo.player1_score} : {gameInfo.player2_score}
      </div>

      <p style={{ fontSize: '1.2rem', color: '#d9534f', fontWeight: 'bold', minHeight: '1.6em', marginBottom: '20px' }}>
        {message}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        
        {/* PANEL GRACZA 1 */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            {gameInfo.p1_name || "???"} {gameInfo.player1_id === userId && <span style={{color: '#999', fontSize: '0.8rem'}}>(Ty)</span>}
          </p>
          <div style={{ width: '100%', height: '25px', background: '#eee', borderRadius: '6px', border: '1px solid #ccc', overflow: 'hidden' }}>
            <div style={{ 
              width: `${gameState.player1_hp}%`, 
              height: '100%', 
              background: gameState.player1_hp > 30 ? '#4caf50' : '#f44336', 
              transition: 'width 0.4s ease-out' 
            }} />
          </div>
          <p style={{ margin: '5px 0' }}>HP: <strong>{gameState.player1_hp}</strong></p>
          <small style={{ color: '#666' }}>Celność: {(parseFloat(gameState.player1_accuracy) * 100).toFixed(0)}%</small>
        </div>

        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#bbb' }}>VS</div>

        {/* PANEL GRACZA 2 */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            {gameInfo.p2_name || "???"} {gameInfo.player2_id === userId && <span style={{color: '#999', fontSize: '0.8rem'}}>(Ty)</span>}
          </p>
          <div style={{ width: '100%', height: '25px', background: '#eee', borderRadius: '6px', border: '1px solid #ccc', overflow: 'hidden' }}>
            <div style={{ 
              width: `${gameState.player2_hp}%`, 
              height: '100%', 
              background: gameState.player2_hp > 30 ? '#4caf50' : '#f44336', 
              transition: 'width 0.4s ease-out' 
            }} />
          </div>
          <p style={{ margin: '5px 0' }}>HP: <strong>{gameState.player2_hp}</strong></p>
          <small style={{ color: '#666' }}>Celność: {(parseFloat(gameState.player2_accuracy) * 100).toFixed(0)}%</small>
        </div>
      </div>

      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #eee' }} />

      {/* INTERFEJS AKCJI */}
      {gameInfo.status === 'active' && (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => handleMove('attack')} 
            style={{ 
              padding: '14px 28px', background: '#f0ad4e', color: 'white', border: 'none', 
              borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
              boxShadow: '0 4px #b07d32' 
            }}
          >
            ATAKUJ
          </button>

          <button 
            onClick={() => handleMove('rev_up')} 
            disabled={isRevUpMaxed}
            style={{ 
              padding: '14px 28px', background: isRevUpMaxed ? '#ccc' : '#5bc0de', color: 'white', 
              border: 'none', borderRadius: '10px', cursor: isRevUpMaxed ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold', fontSize: '1rem', boxShadow: isRevUpMaxed ? 'none' : '0 4px #3a8ea5'
            }}
          >
            {isRevUpMaxed ? "MAX CELNOŚĆ" : "REV UP (+20%)"}
          </button>
        </div>
      )}

      {/* PRZYCISK POWROTU PO MECZU */}
      {gameInfo.status === 'finished' && (
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            marginTop: '10px', padding: '12px 30px', background: '#28a745', color: 'white', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
          }}
        >
          WRÓĆ DO MENU
        </button>
      )}
    </div>
  );
};

export default Arena;