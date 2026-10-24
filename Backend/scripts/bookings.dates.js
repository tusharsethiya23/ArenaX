// bookings.dates.js
// One-off migration: gives bookings made before calendar dates existed a real
// date (they only stored a weekday). Safe to run more than once: bookings that
// already have a date are left alone.
//   Upcoming (pending / confirmed): the next such weekday whose slot hasn't started
//   Finished (completed / declined / cancelled): that weekday on or after the
//     day it was booked, but never in the future
//
// Usage: npm run migrate:booking-dates [-- --dry]

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const { normalizeDay, dateInZone, addDays, nextDateOnWeekday, sessionTimes } = require('../utils/slots.util');

const dry = process.argv.includes('--dry');

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set in Backend/.env');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to database "${mongoose.connection.name}"${dry ? ' (dry run)' : ''}`);

  const today = dateInZone();
  const now = new Date();
  const legacy = await Booking.find({ date: { $in: [null, ''] } });
  let updated = 0;
  let skipped = 0;

  for (const b of legacy) {
    const day = normalizeDay(b.day);
    if (!day) { skipped++; continue; }

    let date;
    if (['pending', 'confirmed'].includes(b.status)) {
      date = nextDateOnWeekday(day, today);
      const { startsAt } = sessionTimes(date, b.timeSlot);
      if (startsAt && startsAt <= now) date = addDays(date, 7);
    } else {
      date = nextDateOnWeekday(day, dateInZone(b.createdAt || now));
      while (date > today) date = addDays(date, -7);
    }

    const times = sessionTimes(date, b.timeSlot);
    console.log(`  ${b._id}  ${b.status.padEnd(9)} ${b.day} ${b.timeSlot} -> ${date}`);
    if (!dry) {
      await Booking.updateOne({ _id: b._id }, { $set: { date, day, ...times } }, { timestamps: false });
    }
    updated++;
  }

  console.log(`${dry ? 'Would update' : 'Updated'} ${updated} booking(s)${skipped ? `, skipped ${skipped} with an unreadable day` : ''}.`);
};

run()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
