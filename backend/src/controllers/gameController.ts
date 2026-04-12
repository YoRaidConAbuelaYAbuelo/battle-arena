import { Request, Response } from 'express';
import pool from '../database/db.js';

// --- 1. DOŁĄCZANIE DO GRY / TWORZENIE LOBBY ---
export const joinOrCreateGame = async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    const activeGame = await pool.query(
    "SELECT id FROM games WHERE (player1_id = $1 OR player2_id = $1) AND status != 'finished'",
    [userId]
  );

    if (activeGame.rows.length > 0) {
      return res.status(200).json({ message: "Powrót do gry", gameId: activeGame.rows[0].id });
    }

    const waitingGame = await pool.query(
      "SELECT id FROM games WHERE status = 'waiting' AND player1_id != $1 LIMIT 1",
      [userId]
    );

    if (waitingGame.rows.length > 0) {
      const gameId = waitingGame.rows[0].id;
      await pool.query("UPDATE games SET player2_id = $1, status = 'active' WHERE id = $2", [userId, gameId]);
      await pool.query(
        "INSERT INTO game_state (game_id, player1_hp, player2_hp, player1_accuracy, player2_accuracy) VALUES ($1, 100, 100, 0.20, 0.20)",
        [gameId]
      );
      return res.status(200).json({ message: "Start walki!", gameId });
    } else {
      const newGame = await pool.query("INSERT INTO games (player1_id, status) VALUES ($1, 'waiting') RETURNING id", [userId]);
      return res.status(201).json({ message: "Oczekiwanie...", gameId: newGame.rows[0].id });
    }
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas dołączania" });
  }
};
export const getGameStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        g.*, 
        u1.username as p1_name, 
        u2.username as p2_name 
      FROM games g
      LEFT JOIN users u1 ON g.player1_id = u1.id
      LEFT JOIN users u2 ON g.player2_id = u2.id
      WHERE g.id = $1
    `;
    const game = await pool.query(query, [id]);
    const state = await pool.query("SELECT * FROM game_state WHERE game_id = $1", [id]);
    
    res.json({ game: game.rows[0], state: state.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Błąd pobierania stanu gry" });
  }
};
// --- 2. WYKONYWANIE RUCHU (Atak / Rev Up) ---
export const submitAction = async (req: Request, res: Response) => {
  const { gameId, userId, action } = req.body;

  try {
    const game = await pool.query("SELECT * FROM games WHERE id = $1", [gameId]);
    const state = await pool.query("SELECT * FROM game_state WHERE game_id = $1", [gameId]);

    if (state.rows.length === 0) return res.status(404).json({ error: "Nie ma takiej gry" });

    const s = state.rows[0];
    const isP1 = game.rows[0].player1_id === userId;
    const isP2 = game.rows[0].player2_id === userId;

    const actionColumn = isP1 ? 'player1_action' : 'player2_action';
    if (s[actionColumn]) return res.status(400).json({ error: "Ruch już wykonany" });

    await pool.query(`UPDATE game_state SET ${actionColumn} = $1 WHERE game_id = $2`, [action, gameId]);

    const updatedState = await pool.query("SELECT * FROM game_state WHERE game_id = $1", [gameId]);
    const us = updatedState.rows[0];

    if (us.player1_action && us.player2_action) {
      return resolveTurn(gameId, us, game.rows[0], res);
    }

    res.json({ message: "Czekaj na ruch przeciwnika" });
  } catch (err) {
    res.status(500).json({ error: "Błąd akcji" });
  }
};

// --- 3. PRZELICZANIE TURY I KONIEC GRY (ELO) ---
async function resolveTurn(gameId: number, s: any, gameInfo: any, res: Response) {
  let p1_hp = s.player1_hp;
  let p2_hp = s.player2_hp;
  let p1_acc = parseFloat(s.player1_accuracy);
  let p2_acc = parseFloat(s.player2_accuracy);

  // Obliczanie obrażeń
// --- LOGIKA GRACZA 1 ---
if (s.player1_action === 'rev_up') {
  // Zwiększamy o 0.20, ale blokujemy na max 0.80
  p1_acc = Math.min(0.80, p1_acc + 0.20); 
} else {
  const hit = Math.random() <= p1_acc;
  if (hit) {
    const dmg = Math.floor(Math.random() * 25) + 16;
    p2_hp = Math.max(0, p2_hp - dmg); // Pasek spadnie do 0, nie niżej
  }
}

// --- LOGIKA GRACZA 2 ---
if (s.player2_action === 'rev_up') {
  // Zwiększamy o 0.20, ale blokujemy na max 0.80
  p2_acc = Math.min(0.80, p2_acc + 0.20);
} else {
  const hit = Math.random() <= p2_acc;
  if (hit) {
    const dmg = Math.floor(Math.random() * 25) + 16;
    p1_hp = Math.max(0, p1_hp - dmg); // Pasek spadnie do 0, nie niżej
  }
}

  // Wizualna poprawka: HP nie może być ujemne
  p1_hp = Math.max(0, p1_hp);
  p2_hp = Math.max(0, p2_hp);

  // LOGIKA KOŃCA RUNDY / MECZU
  if (p1_hp === 0 || p2_hp === 0) {
    if (p1_hp === 0 && p2_hp === 0) {
      // REMIS w turze -> resetujemy HP do 100, nikt nie dostaje punktu
      await pool.query(
        `UPDATE game_state SET 
      player1_hp = 100, 
      player2_hp = 100, 
      player1_accuracy = 0.20, -- RESET TUTAJ
      player2_accuracy = 0.20, -- RESET TUTAJ
      player1_action = NULL, 
      player2_action = NULL 
     WHERE game_id = $1`,
        [gameId]
      );
      return res.json({ message: "Remis w rundzie! Obaj padliście. Reset HP!", p1_hp: 0, p2_hp: 0 });
    }

    // Ktoś wygrał RUNDĘ
    const roundWinner = p1_hp > 0 ? 'player1_score' : 'player1_score';
    const updatedGame = await pool.query(
      `UPDATE games SET ${roundWinner} = ${roundWinner} + 1 WHERE id = $1 RETURNING *`,
      [gameId]
    );

    const g = updatedGame.rows[0];

    // CZY TO KONIEC MECZU? (Do 2 punktów)
    if (g.player1_score >= 2 || g.player1_score >= 2) {
      const finalWinnerId = g.player1_score >= 2 ? g.player1_id : g.player2_id;
      const finalLoserId = g.player1_score >= 2 ? g.player2_id : g.player1_id;

      // Oblicz ELO
      const p1U = await pool.query("SELECT elo FROM users WHERE id = $1", [g.player1_id]);
      const p2U = await pool.query("SELECT elo FROM users WHERE id = $1", [g.player2_id]);
      const eloChange = Math.abs(p1U.rows[0].elo - p2U.rows[0].elo) + 25;

      await pool.query("UPDATE users SET elo = elo + $1 WHERE id = $2", [eloChange, finalWinnerId]);
      await pool.query("UPDATE users SET elo = elo - $1 WHERE id = $2", [eloChange, finalLoserId]);
      await pool.query("UPDATE games SET status = 'finished', winner_id = $1 WHERE id = $2", [finalWinnerId, gameId]);

      return res.json({ message: "MECZ ZAKOŃCZONY!", winnerId: finalWinnerId, p1_hp, p2_hp });
    } else {
      // RESET HP DO NASTĘPNEJ RUNDY
      await pool.query(
        `UPDATE game_state SET 
      player1_hp = 100, 
      player2_hp = 100, 
      player1_accuracy = 0.20, -- RESET TUTAJ
      player2_accuracy = 0.20, -- RESET TUTAJ
      player1_action = NULL, 
      player2_action = NULL 
     WHERE game_id = $1`,
        [gameId]
      );
      return res.json({ message: "Runda dla zwycięzcy! Kolejna runda...", p1_hp, p2_hp });
    }
  }

  // Zwykła tura
  await pool.query(
    "UPDATE game_state SET player1_hp = $1, player2_hp = $2, player1_accuracy = $3, player2_accuracy = $4, player1_action = NULL, player2_action = NULL WHERE game_id = $5",
    [p1_hp, p2_hp, p1_acc, p2_acc, gameId]
  );

  res.json({ message: "Tura zakończona", p1_hp, p2_hp });
}