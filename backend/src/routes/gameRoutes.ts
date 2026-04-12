import { Router } from 'express';
import { joinOrCreateGame } from '../controllers/gameController.js';
import { submitAction, getGameStatus } from '../controllers/gameController.js';

const router = Router();

// Endpoint do szukania przeciwnika lub tworzenia nowej gry
// POST /game/join
router.post('/join', joinOrCreateGame);

// Endpoint do wysyłania ataku lub rev_up
// POST /game/action
router.post('/action', submitAction);
router.get('/:id', getGameStatus);
export default router;