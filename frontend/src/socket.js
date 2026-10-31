// socket.js
// Creates a single shared Socket.io connection for the whole app, similar
// to how axios.js centralizes API calls. Components import this instead of
// creating their own connections.

import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
  autoConnect: false, // RealtimeConnection connects once the user is logged in
  // Sent on every (re)connect, so the server can put us in our own room for direct
  // messages (players) or let us join our deal chats (players and brands)
  auth: (cb) => cb({ token: localStorage.getItem('token') || localStorage.getItem('brandToken') }),
});

export default socket;