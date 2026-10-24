// AdminDashboard.jsx
// Visible only to users with role "admin". Lists every user on the platform
// and allows the admin to delete any account (moderation action).

import { useState, useEffect } from 'react';
import API from '../api/axios';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import VerificationQueue from '../components/portfolio/VerificationQueue';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/admin/all');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Admin deletes any user's account (not their own — uses /admin/:id route,
  // unlike the self-delete route which reads the ID from the token)
  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(`Delete ${name}'s account? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await API.delete(`/users/admin/${id}`);
      fetchUsers(); // refresh list after deletion
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="page max-w-5xl">
      <PageHeader title="Admin dashboard" subtitle={loading ? 'Loading users...' : `${users.length} total users`} />

      <VerificationQueue title="Coach achievements to verify" />

      {!loading && (
        <div className="card p-2 sm:p-3">
          {users.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between gap-3 rounded-2xl p-3 transition-colors hover:bg-canvas"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={u.name} photo={u.profilePhoto} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.name}</p>
                  <p className="truncate text-sm text-muted">{u.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="badge hidden bg-canvas capitalize text-muted sm:inline-flex">{u.role}</span>
                <button onClick={() => handleDelete(u._id, u.name)} className="btn btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
