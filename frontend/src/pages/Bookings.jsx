// Bookings.jsx
// Displays bookings for the logged-in user — coach sees requests received,
// learner sees requests they've sent. Shows the other person's profile photo
// and makes their name clickable to view their public profile page.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // needed to make the name clickable
import { MessageCircle } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';

// Colour coding for each booking status badge
const statusColor = {
  pending: 'bg-canvas text-muted',
  confirmed: 'bg-lime text-ink',
  declined: 'bg-danger/10 text-danger',
  completed: 'bg-ink text-white',
};

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

  return (
    <div className="page max-w-5xl">
      <PageHeader
        title={user.role === 'coach' ? 'Booking requests' : 'My bookings'}
        subtitle={user.role === 'coach' ? 'Sessions learners have asked you for' : 'Sessions you have requested'}
      />

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="empty-state">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            // The "other person" in this booking — coach sees the learner's
            // info, learner sees the coach's info
            const otherPerson = user.role === 'coach' ? b.learner : b.coach;

            return (
              <div
                key={b._id}
                className="flex flex-col gap-4 rounded-[28px] bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {/* Weekday tile, matching the Upcoming sessions style */}
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-canvas">
                    <span className="text-base font-extrabold leading-none">{b.day?.slice(0, 3).toUpperCase()}</span>
                  </div>

                  <Avatar name={otherPerson?.name} photo={otherPerson?.profilePhoto} className="h-11 w-11 text-sm" />

                  <div className="min-w-0">
                    {/* Clicking the name navigates to that user's public profile */}
                    <Link
                      to={`/profile-view/${otherPerson?._id}`}
                      className="block truncate font-semibold hover:underline"
                    >
                      {otherPerson?.name}
                    </Link>
                    <p className="truncate text-sm text-muted">
                      {b.day} · {b.timeSlot}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className={`badge capitalize ${statusColor[b.status]}`}>
                    {b.status}
                  </span>

                  {/* Accept/Decline buttons only shown to coach, only for pending bookings */}
                  {user.role === 'coach' && b.status === 'pending' && (
                    <>
                      <button onClick={() => handleStatusUpdate(b._id, 'confirmed')} className="btn btn-lime">
                        Accept
                      </button>
                      <button onClick={() => handleStatusUpdate(b._id, 'declined')} className="btn btn-soft">
                        Decline
                      </button>
                    </>
                  )}

                  {b.status === 'confirmed' && (
                    <Link to={`/chat/${b._id}`} className="btn btn-dark">
                      <MessageCircle size={16} /> Chat
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
