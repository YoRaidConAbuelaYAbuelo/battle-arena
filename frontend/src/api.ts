const BASE_URL = 'http://localhost:5000';

export const api = {
  // --- Autentykacja ---
  register: (body: object) => 
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    }).then(res => res.json()),

  login: (body: object) => 
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    }).then(res => res.json()),

  // --- Logika Gry ---
  
  // 1. Szukanie przeciwnika lub tworzenie gry
  joinGame: (userId: number) => {
    return fetch(`${BASE_URL}/game/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).then(res => res.json());
  },

  // 2. Wysyłanie ataku lub Rev Up
  sendAction: (gameId: number, userId: number, action: string) => {
    return fetch(`${BASE_URL}/game/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId, action })
    }).then(res => res.json());
  },

  // 3. Pobieranie stanu gry (HP, tura, status) - POLLING
  getGameStatus: (gameId: number) => {
    return fetch(`${BASE_URL}/game/${gameId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());
  }
};