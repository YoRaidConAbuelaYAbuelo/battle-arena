import React, { useState } from 'react';
import { api } from './api';
import Arena from './components/Arena';
import Docs from './components/Docs';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null); // Przechowujemy ID z bazy
  const [gameId, setGameId] = useState<number | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showDocs, setShowDocs] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = isRegister ? await api.register(formData) : await api.login(formData);
    
    if (result.token && result.userId) {
      localStorage.setItem('token', result.token);
      setUserId(result.userId); // WAŻNE: Backend musi zwracać userId
      setUser(formData.username);
    } else {
      alert(result.error || "Błąd autentykacji");
    }
  };

  // Funkcja uruchamiająca szukanie gry
  const startMatchmaking = async () => {
    if (!userId) return;
    const result = await api.joinGame(userId);
    if (result.gameId) {
      setGameId(result.gameId);
    } else {
      alert("Nie udało się dołączyć do gry.");
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '50px' }}>
      <h1>BATTLE ARENA</h1>
      
      {!user ? (
        // --- SEKCJA LOGOWANIA ---
        <div>
          <h2>{isRegister ? 'Register' : 'Login'}</h2>
          <form onSubmit={handleAuth}>
            <input type="text" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} /><br/>
            <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} /><br/>
            <button type="submit">{isRegister ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <button onClick={() => setIsRegister(!isRegister)}>
            Switch to {isRegister ? 'Login' : 'Register'}
          </button>
        </div>
      ) : (
        // --- SEKCJA PO ZALOGOWANIU ---
        <div>
          {!gameId ? (
            <div>
              <h2>Witaj, {user}!</h2>
              <p>Twój ID: {userId}</p>
              <button 
                onClick={startMatchmaking} 
                style={{ padding: '15px 30px', fontSize: '1.2rem', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
              >
                SZUKAJ PRZECIWNIKA
              </button>
            </div>
          ) : (
            // --- SEKCJA ARENY ---
            <Arena userId={userId!} gameId={gameId} />
          )}
        </div>
      )}

      <hr style={{ margin: '40px 0' }} />
      <button onClick={() => setShowDocs(!showDocs)}>{showDocs ? 'Hide' : 'Show'} Docs</button>
      {showDocs && <Docs />}
    </div>
  );
};

export default App;