// Bookings.jsx
// Displays bookings for the logged-in user — coach sees requests received,
// learner sees requests they've sent. Shows the other person's profile photo
// and makes their name clickable to view their public profile page.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // needed to make the name clickable
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Coach and learner hit different endpoints to get "their side" of bookings
  const endpoint = user.role === 'coach' ? '/bookings/my-requests' : '/bookings/my-bookings';

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await API.get(endpoint);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Coach accepts/declines a pending booking
  const handleStatusUpdate = async (id, status) => {
    try {
      await API.put(`/bookings/${id}`, { status });
      fetchBookings(); // refresh list after status change
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  // Color coding for each booking status badge
  const statusColor = {
    pending: 'text-stone border-stone/30',
    confirmed: 'text-teal border-teal/30',
    declined: 'text-signal border-signal/30',
    completed: 'text-ink border-ink/20',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8 border-l-4 border-signal pl-4">
        <h1 className="font-display text-3xl text-ink">
          {user.role === 'coach' ? 'BOOKING REQUESTS' : 'MY BOOKINGS'}
        </h1>
      </div>

      {loading ? (
        <p className="text-stone">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="text-stone">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            // The "other person" in this booking — coach sees the learner's
            // info, learner sees the coach's info
            const otherPerson = user.role === 'coach' ? b.learner : b.coach;

            return (
              <div
                key={b._id}
                className="border border-ink/10 bg-white p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {/* Profile photo — shows a placeholder if user hasn't uploaded one */}
                  <img
                    src={otherPerson?.profilePhoto || 'https://placehold.co/48x48?text=?'}
                    alt={otherPerson?.name}
                    className="w-12 h-12 object-cover border border-ink/10 flex-shrink-0"
                  />

                  <div>
                    {/* Clicking the name navigates to that user's public profile */}
                    <Link
                      to={`/profile-view/${otherPerson?._id}`}
                      className="font-medium text-ink hover:text-signal transition-colors"
                    >
                      {otherPerson?.name}
                    </Link>
                    <p className="text-sm text-stone">
                      {b.day} · {b.timeSlot}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold border px-2 py-1 ${statusColor[b.status]}`}>
                    {b.status.toUpperCase()}
                  </span>

                  {/* Accept/Decline buttons only shown to coach, only for pending bookings */}
                  {user.role === 'coach' && b.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(b._id, 'confirmed')}
                        className="text-sm bg-teal text-white px-3 py-1.5 hover:bg-teal/90"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(b._id, 'declined')}
                        className="text-sm border border-ink/15 text-ink/70 px-3 py-1.5 hover:border-signal hover:text-signal"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {b.status === 'confirmed' && (
                    <Link
                      to={`/chat/${b._id}`}
                      className="text-sm bg-ink text-white px-3 py-1.5 hover:bg-ink/90"
                    >
                      Chat
                    </Link>
                  )}
                </div>


              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookings;