// tournament.controller.js
// Handles creating/listing tournaments and registering teams for them.
const Tournament = require('../models/tournament.model');
const Team = require('../models/team.model');

// Any coach or admin can create a tournament
const createTournament = async (req, res) => {
  try {
    if (req.user.role !== 'coach' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only coaches or admins can create tournaments' });
    }

    const { name, sport, description, location, startDate, registrationDeadline } = req.body;

    const tournament = await Tournament.create({
      name, sport, description, location, startDate, registrationDeadline,
      createdBy: req.user._id,
    });

    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public — list all tournaments, optionally filtered by sport
const getTournaments = async (req, res) => {
  try {
    const { sport } = req.query;
    let filter = {};
    if (sport) filter.sport = sport;

    const tournaments = await Tournament.find(filter)
      .populate('createdBy', 'name')
      .sort({ startDate: 1 }); // soonest first

    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Registers a new team for a tournament. The creator automatically becomes
// captain and the first member; memberEmails lets them add teammates by email.
const registerTeam = async (req, res) => {
  try {
    const { tournamentId, name, memberEmails } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (new Date() > tournament.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Look up any teammates by email (optional — team can register with just the captain)
    const User = require('../models/user.model');
    let memberIds = [req.user._id];

    if (memberEmails && memberEmails.length > 0) {
      const foundUsers = await User.find({ email: { $in: memberEmails } });
      memberIds = [...memberIds, ...foundUsers.map((u) => u._id)];
    }

    const team = await Team.create({
      name,
      tournament: tournamentId,
      captain: req.user._id,
      members: memberIds,
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public — list all teams registered for a given tournament
const getTeamsForTournament = async (req, res) => {
  try {
    const teams = await Team.find({ tournament: req.params.tournamentId })
      .populate('captain', 'name')
      .populate('members', 'name');

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTournament, getTournaments, registerTeam, getTeamsForTournament };