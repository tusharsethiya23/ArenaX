// userCache.util.js
// Every logged-in request needs the user's record (auth middleware). Loading
// it from MongoDB each time costs a database round trip, so it's kept in
// memory for a short while. Any change to a user through Mongoose clears it
// (see the hooks in user.model.js), so edits, verification and deletion still
// take effect on the very next request; TTL_MS only bounds changes made
// outside Mongoose (e.g. by hand in the database).

const { BSON } = require('mongoose').mongo;

const TTL_MS = 30 * 1000;
const MAX_ENTRIES = 5000;
const cache = new Map(); // userId -> { bytes, at }

// A fresh deep copy each time, so one request can't change another's user
const get = (id) => {
  const hit = cache.get(String(id));
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(String(id));
    return null;
  }
  return BSON.deserialize(hit.bytes);
};

const set = (id, plainUser) => {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value); // drop the oldest
  cache.set(String(id), { bytes: BSON.serialize(plainUser), at: Date.now() });
};

const forget = (id) => cache.delete(String(id));
const clear = () => cache.clear();

module.exports = { get, set, forget, clear, TTL_MS };
