import React, { useState } from 'react';
import { api } from './api.ts';
import Docs from './components/Docs.tsx';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showDocs, setShowDocs] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = isRegister ? await api.register(formData) : await api.login(formData);
    
    if (result.token) {
      localStorage.setItem('token', result.token);
      setUser(formData.username);
      alert("Authenticated!");
    } else {
      alert(result.error || result.message);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '50px' }}>
      <h1>BATTLE ARENA</h1>
      
      {!user ? (
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
        <div>
          <h2>Welcome, {user}!</h2>
          <p>Arena logic loading...</p>
        </div>
      )}

      <hr style={{ margin: '40px 0' }} />
      <button onClick={() => setShowDocs(!showDocs)}>
        {showDocs ? 'Hide Documentation' : 'Show Project Documentation'}
      </button>
      {showDocs && <Docs />}
    </div>
  );
};

export default App;

