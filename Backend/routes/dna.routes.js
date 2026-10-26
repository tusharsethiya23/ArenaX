const express = require('express');
const router = express.Router();
const {
  getMyDna, getAthleteDna, setGoal, addAssessment, logActivity, deleteActivity, getMyAthletes,
} = require('../controllers/dna.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireAccess } = require('../utils/access.util');

const dna = requireAccess('athleteDna');
router.get('/me', protect, dna, getMyDna);               // athlete's own dashboard
router.get('/my-athletes', protect, getMyAthletes);      // coach: athletes they've coached
router.get('/athlete/:id', protect, getAthleteDna);      // coach view of one athlete
router.put('/goal', protect, dna, setGoal);
router.post('/assessments', protect, dna, addAssessment); // self or coach assessment
router.post('/activities', protect, dna, logActivity);   // locked drill levels are refused
router.delete('/activities/:id', protect, deleteActivity);

module.exports = router;
