// Tournaments.jsx
// Lists all tournaments, lets coaches/admins create new ones, and lets any
// user register a team for a tournament. Fully responsive layout.

import { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Plus, X } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

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
    <div className="page">
      <PageHeader
        title="Tournaments"
        subtitle="Compete, team up, and climb the ranks"
        action={(user.role === 'coach' || user.role === 'admin') && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} className={`btn ${showCreateForm ? 'btn-soft bg-surface' : 'btn-dark'}`}>
            {showCreateForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Create tournament</>}
          </button>
        )}
      />

      {/* Create tournament form */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          <h2 className="text-lg font-bold">New tournament</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tournament name</label>
              <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required className="input" />
            </div>
            <div>
              <label className="label">Sport</label>
              <input value={createForm.sport} onChange={(e) => setCreateForm({ ...createForm, sport: e.target.value })} required className="input" />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} required className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={3} className="input resize-none" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Start date</label>
              <input type="date" value={createForm.startDate} onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })} required className="input" />
            </div>
            <div>
              <label className="label">Registration deadline</label>
              <input type="date" value={createForm.registrationDeadline} onChange={(e) => setCreateForm({ ...createForm, registrationDeadline: e.target.value })} required className="input" />
            </div>
          </div>
          <button type="submit" className="btn btn-lime px-8">Create</button>
        </form>
      )}

      {/* Tournaments list */}
      {tournaments.length === 0 ? (
        <p className="empty-state">No tournaments yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t, i) => (
            <div key={t._id} className="flex flex-col rounded-[28px] bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                {/* Start date tile, like the Upcoming sessions list */}
                <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${i === 0 ? 'bg-ink text-on-ink' : 'bg-canvas'}`}>
                  <span className="text-xl font-extrabold leading-none">{new Date(t.startDate).getDate()}</span>
                  <span className={`mt-0.5 text-[10px] font-bold uppercase ${i === 0 ? 'text-on-ink/60' : 'text-muted'}`}>
                    {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                </div>
                <span className="badge bg-lime text-on-ink">{t.sport}</span>
              </div>

              <h3 className="mt-4 text-lg font-bold tracking-tight">{t.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} /> {t.location}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><CalendarDays size={14} /> Register by {fmtDate(t.registrationDeadline)}</p>
              {t.description && <p className="mt-3 text-sm text-ink/80">{t.description}</p>}

              <div className="mt-auto pt-5">
                <button onClick={() => setRegisteringFor(t._id)} className="btn btn-dark">
                  Register team
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team registration modal */}
      {registeringFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm">
            <h2 className="mb-4 text-xl font-extrabold tracking-tight">Register team</h2>
            <form onSubmit={handleRegisterTeam} className="space-y-3">
              <input
                placeholder="Team name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                required
                className="input"
              />
              <textarea
                placeholder="Teammate emails, comma-separated (optional)"
                value={teamForm.memberEmails}
                onChange={(e) => setTeamForm({ ...teamForm, memberEmails: e.target.value })}
                rows={3}
                className="input resize-none"
              />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setRegisteringFor(null)} className="btn btn-soft flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-dark flex-1">
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
