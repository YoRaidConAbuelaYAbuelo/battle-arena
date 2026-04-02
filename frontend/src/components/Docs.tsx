import React from 'react';

const Docs: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#f9f9f9', border: '1px solid #ddd' }}>
      <h2>?? Project Documentation</h2>
      <h3>API Endpoints</h3>
      <ul>
        <li><code>POST /auth/register</code> - Body: username, password</li>
        <li><code>POST /auth/login</code> - Returns JWT Token</li>
        <li><code>POST /game/:id/action</code> - Body: "attack" or "rev_up"</li>
      </ul>
      <h3>Game Rules</h3>
      <p>Base Accuracy: 20%. Rev Up: +20% Accuracy. Goal: 0 HP opponent.</p>
    </div>
  );
};

export default Docs;