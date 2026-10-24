// demo.seed.js
// Fills the database with demo coaches, athletes and activity so every part
// of the app has something to show: ~30 users, ~100 posts with photos, likes,
// comments, follows (incl. private accounts with pending requests), bookings
// in every status, reviews, verified achievements, endorsements, tournaments
// with teams, and marketplace content.
//
// All demo accounts use an @demo.arenax email and the password "demo1234".
// Nothing is linked to real users. Remove everything with: npm run clear:demo
//
// Usage: npm run seed:demo            (refuses if demo data already exists)
//        npm run seed:demo -- --reset (clears old demo data first)
// Post photos are placeholder images from picsum.photos (linked, not uploaded).

const bcrypt = require('bcryptjs');
const { connect, clearDemoData, demoUserIds, mongoose, DEMO_DOMAIN, models } = require('./demo.common');

const {
  User, Post, Comment, SavedPost, Follow, Booking, Message, Review, Achievement,
  Endorsement, ProfileView, Content, Tournament, Team,
} = models;

const PASSWORD = 'demo1234';
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

// ---------- Deterministic randomness (same demo world every run) ----------
let seed = 20261024;
const rand = () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const sample = (arr, n) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy.slice(0, n);
};

// ObjectIds that sort by time, so the feed (ordered by _id) matches createdAt.
// Each one gets its own second so ids never collide.
const usedSeconds = new Set();
const idAt = (date) => {
  let sec = Math.floor(date.getTime() / 1000);
  while (usedSeconds.has(sec)) sec -= 1;
  usedSeconds.add(sec);
  return mongoose.Types.ObjectId.createFromTime(sec);
};
const daysAgo = (min, max) => new Date(NOW - (min + rand() * (max - min)) * DAY);

// ---------- People ----------
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOT_TIMES = ['6 AM - 7 AM', '7 AM - 8 AM', '8 AM - 9 AM', '5 PM - 6 PM', '6 PM - 7 PM', '7 PM - 8 PM'];

const COACHES = [
  ['Rahul Sharma', 'Cricket', 'Indore', 'advanced', 12, 1200, 'Former Ranji player. Batting technique, playing pace and match temperament.'],
  ['Vikram Singh', 'Cricket', 'Mumbai', 'advanced', 15, 1500, 'Fast-bowling specialist. Run-ups, wrist position and injury-free bowling.'],
  ['Amit Verma', 'Football', 'Mumbai', 'beginner', 8, 800, 'Grassroots coach. First touch, passing and loving the game.'],
  ['Sneha Kapoor', 'Football', 'Delhi', 'intermediate', 5, 900, 'Midfield play, scanning and decision making under pressure.'],
  ['Priya Nair', 'Tennis', 'Pune', 'intermediate', 6, 1000, 'Serve, footwork and point construction for club players.'],
  ['Arjun Reddy', 'Tennis', 'Hyderabad', 'advanced', 10, 1400, 'ITF-level coaching. Tactical patterns and mental game.'],
  ['Kabir Mehta', 'Badminton', 'Indore', 'beginner', 4, 600, 'Grip, footwork and clean clears for new players.'],
  ['Meera Iyer', 'Badminton', 'Bengaluru', 'advanced', 9, 1100, 'National-level doubles player. Net play and rotation.'],
  ['Rohan Das', 'Basketball', 'Kolkata', 'intermediate', 7, 700, 'Shooting form, ball handling and team defence.'],
  ['Anjali Rao', 'Swimming', 'Chennai', 'beginner', 6, 900, 'Learn-to-swim and stroke correction for all ages.'],
  ['Farhan Ali', 'Athletics', 'Delhi', 'advanced', 11, 1000, 'Sprints and hurdles. Starts, drive phase and speed endurance.'],
  ['Deepak Yadav', 'Kabaddi', 'Jaipur', 'intermediate', 8, 500, 'Raiding skills, footwork and fitness for kabaddi.'],
  ['Neha Joshi', 'Yoga', 'Pune', 'beginner', 5, 700, 'Mobility and recovery yoga for athletes.'],
  ['Sameer Khan', 'Boxing', 'Mumbai', 'advanced', 13, 1300, 'Footwork, defence and ring craft. Private account.'],
];
const ATHLETES = [
  ['Tushar Singh', 'Cricket', 'Indore', 'intermediate', 'Make the state U-19 squad'],
  ['Aarav Gupta', 'Cricket', 'Delhi', 'beginner', 'Learn to bowl leg spin'],
  ['Ishaan Patel', 'Football', 'Ahmedabad', 'intermediate', 'Play for the city club'],
  ['Zoya Sheikh', 'Tennis', 'Mumbai', 'advanced', 'Crack the national rankings'],
  ['Kavya Menon', 'Badminton', 'Bengaluru', 'intermediate', 'Win the inter-college tournament'],
  ['Aditya Kulkarni', 'Athletics', 'Pune', 'beginner', 'Run 100m under 12 seconds'],
  ['Riya Bose', 'Swimming', 'Kolkata', 'beginner', 'Swim 1 km without stopping'],
  ['Harsh Vardhan', 'Kabaddi', 'Jaipur', 'intermediate', 'Get selected for the district team'],
  ['Sana Qureshi', 'Basketball', 'Hyderabad', 'intermediate', 'Improve my three-point shooting'],
  ['Nikhil Jain', 'Cricket', 'Indore', 'advanced', 'Open the batting for my club'],
  ['Pooja Pillai', 'Tennis', 'Chennai', 'beginner', 'Get a consistent serve'],
  ['Yash Thakur', 'Football', 'Delhi', 'beginner', 'Get fit and play weekend leagues'],
  ['Ananya Das', 'Badminton', 'Indore', 'beginner', 'Learn proper footwork'],
  ['Karan Malhotra', 'Boxing', 'Mumbai', 'intermediate', 'Fight my first amateur bout'],
  ['Diya Shah', 'Yoga', 'Ahmedabad', 'beginner', 'Fix my back pain and flexibility'],
  ['Manav Bhatt', 'Cricket', 'Pune', 'intermediate', 'Become a reliable wicketkeeper'],
];
const PRIVATE_NAMES = new Set(['Sameer Khan', 'Zoya Sheikh', 'Nikhil Jain']);

const emailFor = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${DEMO_DOMAIN}`;
const handleFor = (name) => name.split(' ')[0].toLowerCase();

// ---------- Places ----------
const VENUES = {
  Indore: ['Holkar Stadium, Indore', 'Nehru Stadium, Indore'],
  Mumbai: ['Wankhede Stadium, Mumbai', 'Shivaji Park, Mumbai', 'Cooperage Ground, Mumbai'],
  Delhi: ['Jawaharlal Nehru Stadium, Delhi', 'Siri Fort Sports Complex, Delhi'],
  Pune: ['Balewadi Sports Complex, Pune', 'Deccan Gymkhana, Pune'],
  Hyderabad: ['Gachibowli Stadium, Hyderabad', 'LB Stadium, Hyderabad'],
  Bengaluru: ['Kanteerava Stadium, Bengaluru', 'Padukone Academy, Bengaluru'],
  Kolkata: ['Salt Lake Stadium, Kolkata', 'Netaji Indoor Stadium, Kolkata'],
  Chennai: ['Velachery Aquatic Complex, Chennai', 'Nehru Stadium, Chennai'],
  Jaipur: ['Sawai Mansingh Stadium, Jaipur'],
  Ahmedabad: ['Sardar Patel Stadium, Ahmedabad', 'Transstadia, Ahmedabad'],
};

// ---------- Post text ----------
const TAG = (sport) => `#${sport.toLowerCase()}`;
const COACH_POSTS = [
  (s, c) => `Evening session with the U-16 batch. Worked on the basics until they became automatic. Proud of how quickly they picked it up! ${TAG(s)} #training #${c.toLowerCase()}`,
  (s) => `Drill of the week: 3 sets, 40 seconds on, 20 off. Simple, brutal, effective. Try it and tag me. ${TAG(s)} #drilloftheweek`,
  (s) => `Reminder: rest days are training days too. Sleep, hydrate, stretch. Your body adapts when you recover. ${TAG(s)} #recovery`,
  (s) => `New weekend batch starting next month for beginners. Small groups, lots of reps. DM to book a trial session. ${TAG(s)} #coaching`,
  (s) => `Video review with a student today. Tiny change in setup, huge change in results. Details matter. ${TAG(s)} #technique`,
  (s, c) => `Early morning sessions in ${c} hit different. Who else trains before sunrise? ${TAG(s)} #grind`,
  (s) => `Most common mistake I see: rushing the movement. Slow it down, get it right, then add speed. ${TAG(s)} #coachingtips`,
  (s) => `So proud of my students at the district meet this weekend. Three podiums and a lot of personal bests! ${TAG(s)} #proudcoach`,
  (s) => `Mobility routine I give every athlete before practice. 10 minutes, no equipment needed. ${TAG(s)} #warmup #mobility`,
  (s) => `Match-day mindset: control what you can control. Preparation, effort, attitude. ${TAG(s)} #mindset`,
];
const ATHLETE_POSTS = [
  (s, c, coach) => `Man of the match in today's game! Thanks coach @${coach} for all the extra sessions 🙌 ${TAG(s)}`,
  (s) => `Week 6 of training done. Finally feeling the difference in my stamina. ${TAG(s)} #progress`,
  (s) => `New personal best today! Small steps every day add up. ${TAG(s)} #pb`,
  (s, c) => `Looking for a training partner in ${c}. Weekday mornings work best for me. ${TAG(s)}`,
  (s, c, coach) => `First session with @${coach} today and I already learned more than in a month on my own. ${TAG(s)} #learning`,
  (s) => `Rainy day, so indoor fitness instead. No excuses! ${TAG(s)} #fitness`,
  (s) => `Lost today's match, but I know exactly what to work on. Back at it tomorrow. ${TAG(s)} #neverquit`,
  (s) => `Tournament next weekend. Nervous but ready. Any tips for staying calm? ${TAG(s)}`,
];
const COMMENTS = [
  'Great drill! Do you run weekend batches too?', 'This is so helpful, thank you!', 'Congrats, well deserved! 👏',
  'Saving this for my next practice.', 'Which city is this in?', 'Love the energy here 🔥', 'Can beginners join this?',
  'Tried this today, my legs are on fire 😅', 'Well played!', 'Keep going, you are improving every week.',
  'What time do you usually train?', 'Brilliant session, see you next week!', 'This is exactly what I needed today.',
  'How long did it take you to get there?', 'Coach, can you share the full routine?', 'Respect for the early mornings 💪',
];
const REVIEWS = [
  'Very patient and explains things clearly.', 'Fixed my technique in two sessions. Highly recommend!',
  'Great energy and well-planned sessions.', 'Good coach, though sessions sometimes started late.',
  'Knows exactly what to say to keep you motivated.', 'Worth every rupee.',
];

(async () => {
  try {
    await connect();

    const existing = await demoUserIds();
    if (existing.length) {
      if (!process.argv.includes('--reset')) {
        console.log(`Demo data already exists (${existing.length} demo users). Run with --reset to recreate it, or npm run clear:demo to remove it.`);
        return;
      }
      console.log('Removing old demo data first...');
      await clearDemoData();
    }

    const password = await bcrypt.hash(PASSWORD, await bcrypt.genSalt(10));
    const joined = () => daysAgo(30, 60);

    // ---------- Users ----------
    const coachDocs = COACHES.map(([name, sport, location, skillLevelTaught, yearsExperience, pricePerSession, bio]) => {
      const days = sample(WEEKDAYS, int(3, 6));
      const times = sample(SLOT_TIMES, int(2, 3));
      const createdAt = joined();
      return {
        _id: idAt(createdAt), name, email: emailFor(name), password, role: 'coach', sport, location, bio,
        skillLevelTaught, yearsExperience, pricePerSession, isPrivate: PRIVATE_NAMES.has(name),
        availability: days.flatMap((day) => times.map((timeSlot) => ({ day, timeSlot }))),
        createdAt, updatedAt: createdAt,
      };
    });
    const athleteDocs = ATHLETES.map(([name, sport, location, skillLevel, goals]) => {
      const createdAt = joined();
      return {
        _id: idAt(createdAt), name, email: emailFor(name), password, role: 'learner', sport, location,
        skillLevel, goals, isPrivate: PRIVATE_NAMES.has(name),
        bio: `${sport} player from ${location}. Goal: ${goals.toLowerCase()}.`,
        createdAt, updatedAt: createdAt,
      };
    });
    await User.insertMany([...coachDocs, ...athleteDocs], { timestamps: false });
    const coaches = coachDocs;
    const athletes = athleteDocs;
    const everyone = [...coaches, ...athletes];
    console.log(`Users: ${coaches.length} coaches, ${athletes.length} athletes`);

    // ---------- Follows (coaches are followed more; private accounts get some pending requests) ----------
    const follows = [];
    const pairs = new Set();
    for (const user of everyone) {
      const pool = everyone.filter((u) => u._id !== user._id);
      const targets = [...sample(coaches.filter((c) => c._id !== user._id), int(3, 7)), ...sample(pool, int(1, 4))];
      for (const target of targets) {
        const key = `${user._id}-${target._id}`;
        if (pairs.has(key)) continue;
        pairs.add(key);
        const createdAt = daysAgo(1, 28);
        follows.push({
          follower: user._id, following: target._id,
          status: target.isPrivate && chance(0.45) ? 'pending' : 'accepted',
          createdAt, updatedAt: createdAt,
        });
      }
    }
    // Every private account gets at least 3 requests waiting, so there's always something to accept
    for (const target of everyone.filter((u) => u.isPrivate)) {
        const pending = () => follows.filter((f) => f.following === target._id && f.status === 'pending').length;
        for (const user of sample(everyone.filter((u) => u._id !== target._id), everyone.length)) {
            if (pending() >= 3) break;
            const key = `${user._id}-${target._id}`;
            if (pairs.has(key)) continue;
            pairs.add(key);
            const createdAt = daysAgo(0.1, 5);
            follows.push({ follower: user._id, following: target._id, status: 'pending', createdAt, updatedAt: createdAt });
        }
    }
    await Follow.insertMany(follows, { timestamps: false });
    console.log(`Follows: ${follows.filter((f) => f.status === 'accepted').length} accepted, ${follows.filter((f) => f.status === 'pending').length} pending requests`);

    // ---------- Posts ----------
    const posts = [];
    for (let i = 0; i < 100; i++) {
      const isCoach = chance(0.65);
      const author = isCoach ? pick(coaches) : pick(athletes);
      const coachForMention = handleFor(pick(coaches.filter((c) => c.sport === author.sport).concat(coaches)).name);
      const text = (isCoach ? pick(COACH_POSTS) : pick(ATHLETE_POSTS))(author.sport, author.location, coachForMention);
      const createdAt = daysAgo(0.02, 21);
      const imageCount = chance(0.55) ? (chance(0.6) ? 1 : int(2, 4)) : 0;
      posts.push({
        _id: idAt(createdAt),
        author: author._id,
        text,
        images: Array.from({ length: imageCount }, (_, k) => `https://picsum.photos/seed/arenax-${i}-${k}/1200/750`),
        location: imageCount || chance(0.3) ? pick(VENUES[author.location] || ['']) : '',
        likes: [], likeCount: 0, commentCount: 0,
        createdAt, updatedAt: createdAt,
      });
    }

    // Likes: coach posts get more; nobody likes their own post
    for (const post of posts) {
      const authorIsCoach = coaches.some((c) => c._id === post.author);
      const likers = sample(everyone.filter((u) => u._id !== post.author), int(0, authorIsCoach ? 24 : 12));
      post.likes = likers.map((u) => u._id);
      post.likeCount = post.likes.length;
    }

    // Comments, each after its post
    const comments = [];
    for (const post of posts) {
      const n = chance(0.7) ? int(1, 6) : 0;
      for (let k = 0; k < n; k++) {
        const author = pick(everyone.filter((u) => u._id !== post.author));
        const createdAt = new Date(Math.min(NOW - 60000, post.createdAt.getTime() + int(5, 60 * 24 * 2) * 60000));
        comments.push({ _id: idAt(createdAt), post: post._id, author: author._id, text: pick(COMMENTS), createdAt, updatedAt: createdAt });
      }
      post.commentCount = n;
    }
    await Post.insertMany(posts, { timestamps: false });
    await Comment.insertMany(comments, { timestamps: false });
    console.log(`Posts: ${posts.length} (${posts.filter((p) => p.images.length).length} with photos), ${comments.length} comments, ${posts.reduce((n, p) => n + p.likeCount, 0)} likes`);

    // Saved posts
    const saves = [];
    for (const user of sample(everyone, 12)) {
      for (const post of sample(posts.filter((p) => p.author !== user._id), int(2, 6))) {
        const createdAt = daysAgo(0, 10);
        saves.push({ user: user._id, post: post._id, createdAt, updatedAt: createdAt });
      }
    }
    await SavedPost.insertMany(saves, { timestamps: false });

    // ---------- Bookings (pending/confirmed hold their slot; completed get reviews) ----------
    const bookings = [];
    const held = new Set();
    const statuses = [...Array(12).fill('completed'), ...Array(8).fill('confirmed'), ...Array(8).fill('pending'), ...Array(4).fill('declined')];
    for (const status of statuses) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const coach = pick(coaches);
        const slot = pick(coach.availability);
        const key = `${coach._id}|${slot.day}|${slot.timeSlot}`;
        const holds = status === 'pending' || status === 'confirmed';
        if (holds && held.has(key)) continue;
        if (holds) held.add(key);
        const learner = pick(athletes.filter((a) => a.sport === coach.sport).concat(athletes));
        const createdAt = daysAgo(status === 'completed' ? 8 : 0.5, status === 'completed' ? 28 : 7);
        bookings.push({ _id: idAt(createdAt), learner: learner._id, coach: coach._id, day: slot.day, timeSlot: slot.timeSlot, status, createdAt, updatedAt: createdAt });
        break;
      }
    }
    await Booking.insertMany(bookings, { timestamps: false });

    const reviews = bookings.filter((b) => b.status === 'completed').map((b) => ({
      booking: b._id, learner: b.learner, coach: b.coach, rating: pick([5, 5, 5, 4, 4, 3]), comment: pick(REVIEWS),
    }));
    await Review.insertMany(reviews);

    const messages = bookings.filter((b) => b.status === 'confirmed').flatMap((b) => [
      { booking: b._id, sender: b.learner, receiver: b.coach, text: `Hi coach! Looking forward to ${b.day}.` },
      { booking: b._id, sender: b.coach, receiver: b.learner, text: 'See you there. Bring water and come 10 minutes early to warm up.' },
    ]);
    await Message.insertMany(messages);
    console.log(`Bookings: ${bookings.length} (${statuses.length} planned), ${reviews.length} reviews, ${messages.length} chat messages`);

    // ---------- Achievements, endorsements, profile views ----------
    const verifiedCoaches = coaches.filter((c) => ['Vikram Singh', 'Priya Nair', 'Meera Iyer', 'Farhan Ali', 'Rahul Sharma'].includes(c.name));
    await Achievement.insertMany([
      ...verifiedCoaches.map((c) => ({ user: c._id, title: `${c.sport} state champion`, description: `Won the state ${c.sport.toLowerCase()} championship.`, date: daysAgo(400, 2000), verified: true })),
      ...sample(athletes, 4).map((a) => ({ user: a._id, title: 'District meet medal', description: 'Podium finish at the district meet.', date: daysAgo(30, 300), verified: false })),
    ]);
    const endorsements = [];
    for (let i = 0; i < 24; i++) {
      const coach = pick(coaches);
      const endorser = pick(everyone.filter((u) => u._id !== coach._id));
      endorsements.push({ endorser: endorser._id, endorsedUser: coach._id, skill: pick([`${coach.sport} technique`, 'Patience', 'Session planning', 'Motivation', 'Fitness programming']), note: chance(0.6) ? pick(REVIEWS) : '' });
    }
    await Endorsement.insertMany(endorsements);
    await ProfileView.insertMany(coaches.flatMap((c) => Array.from({ length: int(5, 40) }, () => ({ profileOwner: c._id, viewedAt: daysAgo(0, 30) }))));

    // ---------- Tournaments with teams ----------
    const tournamentSpecs = [
      ['Indore T20 Cup', 'Cricket', 'Holkar Stadium, Indore', 'Rahul Sharma'],
      ['Mumbai 5-a-side League', 'Football', 'Cooperage Ground, Mumbai', 'Amit Verma'],
      ['Bengaluru Shuttle Open', 'Badminton', 'Padukone Academy, Bengaluru', 'Meera Iyer'],
      ['Pune Junior Tennis Series', 'Tennis', 'Deccan Gymkhana, Pune', 'Priya Nair'],
    ];
    let teamCount = 0;
    for (const [name, sport, location, creatorName] of tournamentSpecs) {
      const start = new Date(NOW + int(12, 40) * DAY);
      const tournament = await Tournament.create({
        name, sport, location, createdBy: coaches.find((c) => c.name === creatorName)._id,
        description: `Open ${sport.toLowerCase()} tournament for club and academy teams. Medals for the top three.`,
        startDate: start, registrationDeadline: new Date(start.getTime() - int(5, 9) * DAY),
      });
      const players = sample(athletes, 6);
      for (let t = 0; t < 2; t++) {
        const squad = players.slice(t * 3, t * 3 + 3);
        await Team.create({ name: `${squad[0].name.split(' ')[0]}'s ${pick(['Strikers', 'Titans', 'Warriors', 'Falcons'])}`, tournament: tournament._id, captain: squad[0]._id, members: squad.map((p) => p._id) });
        teamCount++;
      }
    }
    console.log(`Tournaments: ${tournamentSpecs.length}, teams: ${teamCount}`);

    // ---------- Marketplace content ----------
    const contentTypes = ['drill', 'training_plan', 'video_course'];
    await Content.insertMany(sample(coaches, 8).map((c) => {
      const type = pick(contentTypes);
      return {
        coach: c._id, type, price: pick([199, 299, 499, 799, 999]),
        title: { drill: `${c.sport} drill pack`, training_plan: `8-week ${c.sport.toLowerCase()} plan`, video_course: `${c.sport} fundamentals video course` }[type],
        description: `Built from ${c.yearsExperience} years of coaching. Step-by-step and beginner friendly.`,
        fileLink: 'https://example.com/demo-content',
      };
    }));

    console.log('\nDone. Log in as any demo user with password "demo1234", e.g.');
    console.log(`  coach:   ${emailFor('Rahul Sharma')}`);
    console.log(`  athlete: ${emailFor('Tushar Singh')}`);
    console.log(`  private: ${emailFor('Zoya Sheikh')} (has pending follow requests)`);
    console.log('Remove everything with: npm run clear:demo');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
