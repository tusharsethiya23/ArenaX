const express = require('express');
const router = express.Router();
const {
  createTournament, getTournaments, registerTeam, getTeamsForTournament,
} = require('../controllers/tournament.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createTournament);
router.get('/', getTournaments);
router.post('/register-team', protect, registerTeam);
router.get('/:tournamentId/teams', getTeamsForTournament);

module.exports = router;