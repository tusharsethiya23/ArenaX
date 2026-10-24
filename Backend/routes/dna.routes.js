const express = require('express');
const router = express.Router();
const {
  getMyDna, getAthleteDna, setGoal, addAssessment, logActivity, deleteActivity, getMyAthletes,
} = require('../controllers/dna.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/me', protect, getMyDna);                    // athlete's own dashboard
router.get('/my-athletes', protect, getMyAthletes);      // coach: athletes they've coached
router.get('/athlete/:id', protect, getAthleteDna);      // coach view of one athlete
router.put('/goal', protect, setGoal);
router.post('/assessments', protect, addAssessment);     // self or coach assessment
router.post('/activities', protect, logActivity);
router.delete('/activities/:id', protect, deleteActivity);

module.exports = router;
