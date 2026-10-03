// AdminDashboard.jsx
// Visible only to users with role "admin". Lists every user on the platform
// and allows the admin to delete any account (moderation action).

import { useState, useEffect } from 'react';
import API from '../api/axios';

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

  if (loading) return <p className="text-stone text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 border-l-4 border-signal pl-4">
        <h1 className="font-display text-3xl text-ink">ADMIN DASHBOARD</h1>
        <p className="text-stone mt-1 text-sm">{users.length} total users</p>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u._id}
            className="border border-ink/10 bg-white p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-ink">{u.name}</p>
              <p className="text-sm text-stone">{u.email} · {u.role}</p>
            </div>
            <button
              onClick={() => handleDelete(u._id, u.name)}
              className="text-sm border border-signal text-signal px-3 py-1.5 hover:bg-signal hover:text-white transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;