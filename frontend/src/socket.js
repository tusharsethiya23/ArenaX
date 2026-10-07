// socket.js
// Creates a single shared Socket.io connection for the whole app, similar
// to how axios.js centralizes API calls. Components import this instead of
// creating their own connections.

import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
  autoConnect: false, // we'll connect manually once the user is logged in
});

export default socket;