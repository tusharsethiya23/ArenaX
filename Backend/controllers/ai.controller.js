// ai.controller.js
// AI coach (POST /api/ai/ask), powered by Google Gemini.
// Each question is answered with the user's context: role, sport, level, and
// for athletes their Athlete DNA (scores, goal, biggest gaps, weekly plan),
// so "build me a plan for my biggest gap" gets a personal answer.
//
// Models are tried in order; if one is busy (503), rate-limited (429),
// retired (404), unreachable or slower than 12 s, the next is used, within a
// 40 s overall budget. Set GEMINI_MODEL in .env to put a different model first.

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Assessment = require('../models/assessment.model');
const ActivityLog = require('../models/activityLog.model');
const {
  GOALS, DIMENSIONS, combineScores, overallOf, gapsFor, buildPlan, planProgress, readinessFor,
} = require('../utils/dna.util');

const MODELS = [...new Set([process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'].filter(Boolean))];
const MAX_MESSAGE = 1000;     // characters per question
const MAX_HISTORY = 10;       // earlier messages sent along for context
const RATE_LIMIT = Number(process.env.AI_RATE_LIMIT) || 15; // questions per user...
const RATE_WINDOW = 60 * 1000; // ...per minute
const RETRYABLE = new Set([404, 429, 500, 503, 'timeout', 'network']);
const MODEL_TIMEOUT = 12 * 1000; // per model; a stalled call moves on to the next model
const TOTAL_BUDGET = 40 * 1000;  // never keep the user waiting longer than this overall

// ---------- Per-user rate limit (in memory; resets when the server restarts) ----------
const recent = new Map(); // userId -> timestamps of recent questions
const rateLimited = (userId) => {
  const now = Date.now();
  const times = (recent.get(userId) || []).filter((t) => now - t < RATE_WINDOW);
  if (times.length >= RATE_LIMIT) return true;
  times.push(now);
  recent.set(userId, times);
  return false;
};

// ---------- What the AI is told about the user ----------
const dnaContext = async (user) => {
  const since = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  const [assessments, logs] = await Promise.all([
    Assessment.find({ athlete: user._id }).lean(),
    ActivityLog.find({ athlete: user._id, doneAt: { $gte: since } }).lean(),
  ]);
  const combined = combineScores(assessments);
  if (!combined) return 'They have not built their Athlete DNA yet (no skill ratings). Suggest they open "My DNA" to rate themselves.';

  const gaps = gapsFor(combined.scores, user.careerGoal);
  const plan = buildPlan(gaps, user.sport);
  const { items, consistency } = planProgress(plan, logs);
  const lines = [
    `Athlete DNA skill scores (1-10): ${DIMENSIONS.map((d) => `${d.label} ${combined.scores[d.key]}`).join(', ')}. Overall ${overallOf(combined.scores)}.`,
    user.careerGoal
      ? `Career goal: ${GOALS[user.careerGoal].label} (target ${GOALS[user.careerGoal].target}/10 in every skill). Readiness ${readinessFor(combined.scores, user.careerGoal, consistency)}%.`
      : 'No career goal chosen yet.',
  ];
  const open = gaps.filter((g) => g.gap > 0);
  if (open.length) lines.push(`Biggest gaps: ${open.slice(0, 3).map((g) => `${g.label} (${g.current}, needs +${g.gap})`).join(', ')}.`);
  if (items.length) lines.push(`Current ArenaX weekly plan: ${items.map((p) => `${p.title} ${p.doneThisWeek}/${p.perWeek} done this week`).join('; ')}. Plan consistency over 4 weeks: ${Math.round(consistency * 100)}%.`);
  return lines.join('\n');
};

const systemInstruction = async (user) => {
  const who = user.role === 'coach'
    ? `The user is a COACH${user.sport ? ` of ${user.sport}` : ''}${user.skillLevelTaught ? `, teaching ${user.skillLevelTaught} players` : ''}${user.location ? `, based in ${user.location}` : ''}. Help them plan sessions, drills, progressions and athlete development.`
    : `The user is an ATHLETE${user.sport ? ` who plays ${user.sport}` : ''}${user.skillLevel ? ` at ${user.skillLevel} level` : ''}${user.location ? `, based in ${user.location}` : ''}.${user.goals ? ` Their stated goal: "${user.goals}".` : ''}`;
  const dna = user.role === 'learner' ? `\n\n${await dnaContext(user)}` : '';

  return [
    'You are the AI coach inside ArenaX, a sports platform connecting athletes with coaches.',
    `The user's name is ${user.name}.`,
    who + dna,
    '',
    'How to answer:',
    '- Be practical and specific to their sport, level and (for athletes) their DNA gaps. Give drills with sets, reps or duration when useful.',
    '- Keep it short: a few sentences or a short list. Use simple markdown: **bold** and "- " bullet lists only. No tables or headings.',
    '- Encourage booking a human coach on ArenaX for technique that needs eyes-on feedback.',
    '- Safety: you are not a doctor. For pain, injury, dizziness or medical conditions, tell them to stop and see a medical professional. Never give medication doses or extreme diet/weight-cutting advice.',
    '- If asked about something unrelated to sport, training, fitness, nutrition, recovery, mindset or using ArenaX, politely steer back to those topics.',
  ].join('\n');
};

// Earlier messages from the client -> Gemini history (must start with the user, roles alternating)
const cleanHistory = (raw) => {
  if (!Array.isArray(raw)) return [];
  const turns = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text.slice(0, 2000) }] }));
  while (turns.length && turns[0].role !== 'user') turns.shift();
  // Merge accidental repeats of the same role so roles alternate
  return turns.reduce((acc, t) => {
    if (acc.length && acc.at(-1).role === t.role) acc.at(-1).parts[0].text += `\n${t.parts[0].text}`;
    else acc.push(t);
    return acc;
  }, []);
};

// POST /api/ai/ask — { message, history?: [{ role: 'user'|'assistant', text }] } -> { reply }
const askCoach = async (req, res) => {
  try {
    if (!req.user) return res.status(403).json({ message: 'The AI coach is for ArenaX users' });
    const key = (process.env.GEMINI_API_KEY || '').trim();
    if (!key) return res.status(503).json({ message: "The AI coach isn't set up yet (missing GEMINI_API_KEY)." });

    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ message: 'Ask a question first' });
    if (message.length > MAX_MESSAGE) return res.status(400).json({ message: `Questions can be at most ${MAX_MESSAGE} characters` });
    if (rateLimited(String(req.user._id))) {
      return res.status(429).json({ message: "You're asking very fast. Take a breath and try again in a minute." });
    }

    const genAI = new GoogleGenerativeAI(key);
    const instruction = await systemInstruction(req.user);
    const history = cleanHistory(req.body.history);

    let lastError;
    const started = Date.now();
    for (const modelName of MODELS) {
      // Stop trying further models once the overall budget is used up
      const remaining = TOTAL_BUDGET - (Date.now() - started);
      if (remaining < 3000) break;
      const limit = Math.min(MODEL_TIMEOUT, remaining);
      try {
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: instruction }, { timeout: limit });
        // Our own timer too, in case the SDK's timeout doesn't fire
        let timer;
        const timeout = new Promise((_, reject) => {
          timer = setTimeout(() => reject(Object.assign(new Error(`${modelName} timed out`), { status: 'timeout' })), limit + 500);
        });
        const result = await Promise.race([model.startChat({ history }).sendMessage(message), timeout]).finally(() => clearTimeout(timer));
        const reply = result.response.text().trim();
        if (!reply) throw Object.assign(new Error('Empty reply'), { status: 500 });
        return res.json({ reply, model: modelName });
      } catch (err) {
        lastError = err;
        // The SDK reports its own timeout/abort and network failures without a status
        if (!err.status && /abort|timed? ?out/i.test(err.message || '')) err.status = 'timeout';
        if (!err.status && /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|network/i.test(err.message || '')) err.status = 'network';
        if (!RETRYABLE.has(err.status)) break; // e.g. blocked content or a bad key: don't try other models
      }
    }

    console.error('AI coach failed:', lastError?.status, lastError?.message?.split('\n')[0]);
    if (lastError?.status === 400 && /API key/i.test(lastError.message)) {
      return res.status(503).json({ message: "The AI coach isn't set up correctly (invalid API key)." });
    }
    if (/SAFETY|blocked/i.test(lastError?.message || '')) {
      return res.status(422).json({ message: "I can't help with that one. Try asking about training, fitness or recovery." });
    }
    res.status(503).json({ message: 'The AI coach is busy right now. Please try again in a moment.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { askCoach };
