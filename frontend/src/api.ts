const BASE_URL = 'http://localhost:5000';

export const api = {
  // Auth
  register: (body: object) => fetch(`${BASE_URL}/auth/register`, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  }).then(res => res.json()),

  login: (body: object) => fetch(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  }).then(res => res.json()),

  // Game (Protected)
  sendAction: (gameId: number, action: string) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/game/${gameId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    }).then(res => res.json());
  }
};
