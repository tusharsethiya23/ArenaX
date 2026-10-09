// Tournaments.jsx
// Lists all tournaments, lets coaches/admins create new ones, and lets any
// user register a team for a tournament. Fully responsive layout.

import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Tournaments = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [registeringFor, setRegisteringFor] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: '', sport: '', description: '', location: '', startDate: '', registrationDeadline: '',
  });
  const [teamForm, setTeamForm] = useState({ name: '', memberEmails: '' });

  const fetchTournaments = async () => {
    const res = await API.get('/tournaments');
    setTournaments(res.data);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/tournaments', createForm);
      setCreateForm({ name: '', sport: '', description: '', location: '', startDate: '', registrationDeadline: '' });
      setShowCreateForm(false);
      fetchTournaments();
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleRegisterTeam = async (e) => {
    e.preventDefault();
    try {
      const emails = teamForm.memberEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      await API.post('/tournaments/register-team', {
        tournamentId: registeringFor,
        name: teamForm.name,
        memberEmails: emails,
      });
      alert('Team registered!');
      setRegisteringFor(null);
      setTeamForm({ name: '', memberEmails: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 border-l-4 border-signal pl-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink">TOURNAMENTS</h1>
          <p className="text-stone text-xs sm:text-sm mt-1">Compete, team up, and climb the ranks</p>
        </div>
        {(user.role === 'coach' || user.role === 'admin') && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-signal text-white px-4 py-2 text-sm font-semibold hover:bg-signal/90 w-full sm:w-auto"
          >
            {showCreateForm ? 'Cancel' : '+ Create Tournament'}
          </button>
        )}
      </div>

      {/* Create tournament form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="border border-ink/10 bg-white p-4 sm:p-6 mb-8 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Tournament name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
              className="border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-signal"
            />
            <input
              placeholder="Sport"
              value={createForm.sport}
              onChange={(e) => setCreateForm({ ...createForm, sport: e.target.value })}
              required
              className="border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-signal"
            />
          </div>
          <input
            placeholder="Location"
            value={createForm.location}
            onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
            required
            className="w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-signal"
          />
          <textarea
            placeholder="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            className="w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-signal"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone mb-1">Start date</label>
              <input
                type="date"
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                required
                className="w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-signal"
              />
            </div>
            <div>
              <label className="block text-xs text-stone mb-1">Registration deadline</label>
              <input
                type="date"
                value={createForm.registrationDeadline}
                onChange={(e) => setCreateForm({ ...createForm, registrationDeadline: e.target.value })}
                required
                className="w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-signal"
              />
            </div>
          </div>
          <button type="submit" className="w-full sm:w-auto bg-ink text-white px-5 py-2 text-sm font-semibold hover:bg-ink/90">
            Create
          </button>
        </form>
      )}

      {/* Tournaments list */}
      <div className="grid sm:grid-cols-2 gap-4">
        {tournaments.map((t) => (
          <div key={t._id} className="border border-ink/10 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-base sm:text-lg text-ink">{t.name}</h3>
              <span className="text-xs text-teal font-semibold whitespace-nowrap">{t.sport}</span>
            </div>
            <p className="text-xs sm:text-sm text-stone mt-1">{t.location}</p>
            <p className="text-xs text-stone mt-1">
              Starts {new Date(t.startDate).toLocaleDateString()} · Register by{' '}
              {new Date(t.registrationDeadline).toLocaleDateString()}
            </p>
            {t.description && <p className="text-xs sm:text-sm text-ink/70 mt-2">{t.description}</p>}

            <button
              onClick={() => setRegisteringFor(t._id)}
              className="mt-3 w-full sm:w-auto border border-signal text-signal px-4 py-1.5 text-xs sm:text-sm font-semibold hover:bg-signal hover:text-white transition-colors"
            >
              Register Team
            </button>
          </div>
        ))}
      </div>

      {/* Team registration modal */}
      {registeringFor && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-4 z-50">
          <div className="bg-paper border border-ink/10 max-w-sm w-full p-5 sm:p-6">
            <h2 className="font-display text-lg sm:text-xl text-ink mb-4">REGISTER TEAM</h2>
            <form onSubmit={handleRegisterTeam} className="space-y-3">
              <input
                placeholder="Team name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                required
                className="w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-signal"
              />
              <textarea
                placeholder="Teammate emails, comma-separated (optional)"
                value={teamForm.memberEmails}
                onChange={(e) => setTeamForm({ ...teamForm, memberEmails: e.target.value })}
                className="w-full border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-signal"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRegisteringFor(null)}
                  className="flex-1 border border-ink/15 text-ink/70 py-2 text-sm hover:border-signal hover:text-signal"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-signal text-white py-2 text-sm font-semibold hover:bg-signal/90">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tournaments;