import React, { useState } from 'react';
import { api } from './api';
import Dashboard from './components/Dashboard';
import Docs from './components/Docs';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showDocs, setShowDocs] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = isRegister ? await api.register(formData) : await api.login(formData);

      // 1. Sprawdzamy czy API zwróciło jawny błąd (np. status 400 lub 500)
      if (result.error) {
        alert(`Błąd: ${result.error}`);
        return;
      }

      // 2. Logika po REJESTRACJI
      if (isRegister) {
        alert("Konto założone! Teraz możesz się zalogować.");
        setIsRegister(false); // Automatycznie przełączamy formularz na logowanie
        return;
      }

      // 3. Logika po LOGOWANIU (tutaj musi być token i userId)
      if (result.token && result.userId) {
        localStorage.setItem('token', result.token);
        setUserId(result.userId);
        setUser(formData.username);
      } else {
        alert("Nie otrzymano danych logowania z serwera.");
      }

    } catch (err) {
      console.error("Critical Auth Error:", err);
      alert("Wystąpił nieoczekiwany błąd połączenia.");
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '50px' }}>
      {!user ? (
        // --- SEKCJA LOGOWANIA (Pozostaje w App) ---
        <div>
          <h1>BATTLE ARENA</h1>
          <h2>{isRegister ? 'Zarejestruj się' : 'Zaloguj się'}</h2>
          <form onSubmit={handleAuth}>
            <input type="text" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} /><br/>
            <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} /><br/>
            <button type="submit" style={{ margin: '10px', padding: '10px 20px' }}>
              {isRegister ? 'Załóż konto' : 'Wejdź do gry'}
            </button>
          </form>
          <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
            {isRegister ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
          </button>
        </div>
      ) : (
        // --- SEKCJA PO ZALOGOWANIU (Całość przejmuje Dashboard) ---
        <Dashboard userId={userId!} username={user} />
      )}

      <hr style={{ margin: '40px 0' }} />
      <button onClick={() => setShowDocs(!showDocs)}>{showDocs ? 'Ukryj' : 'Pokaż'} Dokumentację</button>
      {showDocs && <Docs />}
      
      {user && (
        <button onClick={() => { setUser(null); setUserId(null); localStorage.removeItem('token'); }} 
                style={{ marginTop: '20px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
          Wyloguj
        </button>
      )}
    </div>
  );
};

export default App;