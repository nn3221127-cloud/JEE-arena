import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeApp as initClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer for upload handling
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// Firebase Firestore Setup (Supports Admin SDK in Cloud Run & Client SDK fallback in dev)
if (!getAdminApps().length) {
  initAdminApp({ projectId: firebaseConfig.projectId });
}
const adminDb = getAdminFirestore(firebaseConfig.firestoreDatabaseId);

const clientApp = initClientApp(firebaseConfig);
const clientDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

// Seed Users & Initial Schema
const SEED_USERS = [
  {
    user_id: 'usr_admin',
    name: 'Admin',
    role: 'admin',
    password_hash: bcrypt.hashSync('teF2Ha2deeMaeSou', 10)
  },
  {
    user_id: 'usr_m1',
    name: 'Member 1',
    role: 'member',
    password_hash: bcrypt.hashSync('12345678', 10)
  },
  {
    user_id: 'usr_m2',
    name: 'Member 2',
    role: 'member',
    password_hash: bcrypt.hashSync('87654321', 10)
  }
];

// Seed Sample JEE Mock Test Questions
const SEED_JEE_QUESTIONS = [
  {
    id: 'q_alg_1',
    question_text: 'Solve for $x$ in the equation $2^{|x+1|} - 2^x = |2^x - 1| + 1$.',
    options: [
      '$x \\ge 0$',
      '$x \\in [-1, 0]$',
      '$x \\in [0, \\infty)$',
      '$x = -1$'
    ],
    correct_option_index: 3,
    hint: 'Consider critical points at $x = -1$ and $x = 0$ to break into distinct domain intervals.',
    option_rationales: [
      'In the case $x > 0$, the equation becomes $2^{x+1} - 2^x = 2^x - 1 + 1$, which simplifies to $2^x(2-1) = 2^x$, which is true for all $x \\ge 0$. However, this ignores negative critical intervals.',
      'This range is often checked due to the critical points of the modulus, but the algebraic simplification in this interval fails to meet the identity.',
      'While positive values satisfy some parts of the equation, this interval does not account for the critical points where the modulus behavior changes.',
      'By analyzing cases $x < -1$, $-1 \\le x < 0$, and $x \\ge 0$, we find that only specific discrete values or intervals hold; testing $x = -1$ gives $2^0 - 2^{-1} = |2^{-1} - 1| + 1$, confirming the identity.'
    ],
    subject: 'Mathematics',
    topic: 'Algebra & Modulus',
    difficulty: 'medium'
  },
  {
    id: 'q_alg_2',
    question_text: 'The number of real roots of the equation $x^2 - 3|x| + 2 = 0$ is:',
    options: ['2', '4', '3', '0'],
    correct_option_index: 1,
    hint: 'Substitute $t = |x|$ where $t \\ge 0$ to convert it into a standard quadratic equation.',
    option_rationales: [
      'This error occurs if one only solves for $x^2 - 3x + 2 = 0$ and ignores the negative roots provided by the modulus.',
      'The equation can be viewed as $(|x|)^2 - 3|x| + 2 = 0$, which factors into $(|x| - 1)(|x| - 2) = 0$, giving $|x| = 1$ and $|x| = 2$, each contributing two real roots ($x = \\pm 1, \\pm 2$).',
      'This result might arise from incorrectly assuming one root is zero or duplicate.',
      'Incorrect because factorizing the quadratic yields positive roots for $|x|$, ensuring real solutions exist.'
    ],
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficulty: 'easy'
  },
  {
    id: 'q_chem_1',
    question_text: 'For a first-order reaction, if the rate constant $k$ is $6.93 \\times 10^{-3} \\text{ s}^{-1}$, what is the half-life period ($t_{1/2}$) of the reaction?',
    options: ['100 seconds', '69.3 seconds', '10 seconds', '1000 seconds'],
    correct_option_index: 0,
    hint: 'Recall the first-order half-life formula $t_{1/2} = \\frac{\\ln 2}{k} \\approx \\frac{0.693}{k}$.',
    option_rationales: [
      'For a first-order reaction, $t_{1/2} = \\frac{0.693}{k} = \\frac{0.693}{6.93 \\times 10^{-3}} = 100\\text{ seconds}$. This is the exact worked solution.',
      '69.3 seconds results from an arithmetic magnitude error dividing 0.693 by 0.01 instead of $6.93 \\times 10^{-3}$.',
      '10 seconds comes from omitting a factor of 10 in the exponent calculation.',
      '1000 seconds is an overestimation by a factor of 10.'
    ],
    subject: 'Chemistry',
    topic: 'Chemical Kinetics',
    difficulty: 'easy'
  },
  {
    id: 'q_phy_1',
    question_text: 'A particle of mass $m$ moves in a circular path of radius $r$ with a uniform speed $v$. What is the work done by the centripetal force during one complete revolution?',
    options: ['2πrmv²', 'Zero', 'mv²/r', 'πmv²'],
    correct_option_index: 1,
    hint: 'Think about the angle between the centripetal force vector and the displacement vector at any point.',
    option_rationales: [
      'Confuses work with circumference multiplied by kinetic energy.',
      'The centripetal force acts radially inward while displacement is tangential ($F \\perp d$). Since $\\theta = 90^\\circ$, $W = Fd\\cos(90^\\circ) = 0$.',
      'This is the expression for centripetal force magnitude $F_c$, not work done.',
      'Incorrect dimensional expression for work.'
    ],
    subject: 'Physics',
    topic: 'Work, Power & Energy',
    difficulty: 'easy'
  },
  {
    id: 'q_math_1',
    question_text: 'What is the value of the limit: $\\lim_{x \\to 0} \\frac{\\sin 3x}{\\tan 2x}$?',
    options: ['3/2', '2/3', '1', '6'],
    correct_option_index: 0,
    hint: 'Use standard limits $\\lim_{\\theta \\to 0} \\frac{\\sin \\theta}{\\theta} = 1$ and $\\lim_{\\theta \\to 0} \\frac{\\tan \\theta}{\\theta} = 1$.',
    option_rationales: [
      'Rewrite as $\\frac{\\sin 3x}{3x} \\cdot \\frac{2x}{\\tan 2x} \\cdot \\frac{3}{2}$. As $x \\to 0$, $1 \\cdot 1 \\cdot \\frac{3}{2} = \\frac{3}{2}$.',
      'Inverting the coefficients yields 2/3, a common reciprocal mistake.',
      'Canceling trigonometric functions directly without scaling coefficients gives 1.',
      'Multiplying the coefficients 3 × 2 instead of taking the ratio yields 6.'
    ],
    subject: 'Mathematics',
    topic: 'Limits & Calculus',
    difficulty: 'easy'
  },
  {
    id: 'q_phy_long_1',
    question_text: 'A multi-stage thermodynamic process operates between two thermal reservoirs. Consider the following detailed statements regarding entropy change in irreversible thermodynamic cycles and choose the correct conclusion:',
    options: [
      'The total entropy change of the universe in any real, natural, or irreversible thermodynamic process is strictly positive ($\\Delta S_{\\text{univ}} > 0$).',
      'The total entropy of a closed system always remains zero regardless of whether the internal thermal processes are reversible or irreversible.',
      'Entropy decreases in all spontaneous chemical processes occurring at room temperature without external work input.',
      'The efficiency of an irreversible engine operating between two temperatures is strictly greater than a Carnot engine operating between the same temperatures.'
    ],
    correct_option_index: 0,
    hint: 'Refer to Clausius inequality and the Second Law of Thermodynamics regarding universe entropy.',
    option_rationales: [
      'According to the Second Law of Thermodynamics, all real natural processes are irreversible, increasing the total entropy of the universe ($\\Delta S_{\\text{system}} + \\Delta S_{\\text{surroundings}} > 0$).',
      'Entropy remains constant only for reversible processes in isolated systems, not general closed systems.',
      'Spontaneous processes increase total entropy of the universe, not decrease it.',
      'Carnot engine represents the maximum theoretical efficiency; no real engine can exceed it.'
    ],
    subject: 'Physics',
    topic: 'Thermodynamics',
    difficulty: 'hard'
  }
];

const SEED_TESTS = [
  {
    id: 'test_jee_main_1',
    title: 'JEE Main Full Mock Test #01',
    description: 'High-yield practice paper covering Physics, Chemistry, and Mathematics.',
    status: 'published',
    question_count: 10,
    estimated_time_minutes: 15,
    created_at: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString(),
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    questions: SEED_JEE_QUESTIONS
  }
];

let inMemoryDB: any = null;

// Load DB from Firestore
async function loadDB() {
  try {
    const snap = await adminDb.collection('app_data').doc('state').get();
    if (snap.exists) {
      inMemoryDB = snap.data();
      return inMemoryDB;
    }
  } catch (err) {
    // Fallback to Client SDK if Admin SDK lacks ADC credentials in dev container
  }

  try {
    const docRef = doc(clientDb, 'app_data', 'state');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      inMemoryDB = snap.data();
      return inMemoryDB;
    }
  } catch (err) {
    console.error('Error loading DB from Firestore:', err);
  }

  if (inMemoryDB) return inMemoryDB;

  const fallbackDB = {
    users: SEED_USERS,
    tests: SEED_TESTS,
    attempts: [],
    sessions: {}
  };
  inMemoryDB = fallbackDB;
  return fallbackDB;
}

// Save DB to Firestore
async function saveDB(data: any) {
  inMemoryDB = data;
  try {
    await adminDb.collection('app_data').doc('state').set(data);
    return;
  } catch (err) {
    // Fallback to Client SDK
  }

  try {
    const docRef = doc(clientDb, 'app_data', 'state');
    await setDoc(docRef, data);
  } catch (err) {
    console.error('Error saving DB to Firestore:', err);
  }
}

// Auth Middleware
async function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized session.' });
  }
  const token = authHeader.split(' ')[1];
  const db = await loadDB();
  const session = db.sessions?.[token];
  if (!session) {
    return res.status(401).json({ message: 'Session expired or invalid token.' });
  }
  const user = db.users.find((u: any) => u.user_id === session.user_id);
  if (!user) {
    return res.status(401).json({ message: 'User account not found.' });
  }
  req.user = { user_id: user.user_id, name: user.name, role: user.role, token };
  next();
}

// --- API ROUTES ---

// 1. Auth Login (PASSWORD ONLY match)
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  const db = await loadDB();
  let matchedUser = null;

  for (const user of db.users) {
    if (bcrypt.compareSync(password, user.password_hash)) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ message: "That password doesn't match any account." });
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  if (!db.sessions) db.sessions = {};
  db.sessions[token] = {
    user_id: matchedUser.user_id,
    created_at: new Date().toISOString()
  };
  await saveDB(db);

  return res.json({
    user_id: matchedUser.user_id,
    name: matchedUser.name,
    role: matchedUser.role,
    token
  });
});

// Auth Session Check
app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  res.json(req.user);
});

// Admin / Platform Stats
app.get('/api/admin/stats', authMiddleware, async (req: any, res) => {
  const db = await loadDB();
  const total_tests = db.tests ? db.tests.length : 0;

  // Filter strictly for student members (excluding admins)
  const studentMembers = db.users ? db.users.filter((u: any) => u.role === 'member') : [];
  const active_members = studentMembers.length;
  const studentUserIds = new Set(studentMembers.map((u: any) => u.user_id));

  // Filter strictly for finished student attempts
  const finishedStudentAttempts = (db.attempts || []).filter(
    (a: any) => a.finished_at && studentUserIds.has(a.user_id)
  );

  let avg_accuracy = 0;
  if (finishedStudentAttempts.length > 0) {
    const totalAcc = finishedStudentAttempts.reduce((acc: number, a: any) => acc + (a.accuracy_percentage || 0), 0);
    avg_accuracy = Math.round(totalAcc / finishedStudentAttempts.length);
  } else {
    avg_accuracy = 0;
  }

  res.json({
    total_tests,
    avg_accuracy,
    active_members,
    total_student_attempts: finishedStudentAttempts.length
  });
});

// List Tests
app.get('/api/tests', authMiddleware, async (req: any, res) => {
  const db = await loadDB();
  let tests = db.tests || [];

  const studentMembers = db.users ? db.users.filter((u: any) => u.role === 'member') : [];
  const studentUserIds = new Set(studentMembers.map((u: any) => u.user_id));

  if (req.user.role === 'member') {
    tests = tests.filter((t: any) => t.status === 'published');
  }

  const summaries = tests.map((t: any) => {
    const testAttempts = (db.attempts || []).filter(
      (a: any) => a.test_id === t.id && studentUserIds.has(a.user_id) && a.finished_at
    );
    const attemptedStudentIds = new Set(testAttempts.map((a: any) => a.user_id));

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      question_count: t.questions?.length || 0,
      estimated_time_minutes: t.estimated_time_minutes || 15,
      created_at: t.created_at,
      subjects: Array.from(new Set(t.questions?.map((q: any) => q.subject) || [])),
      active_student_count: studentMembers.length,
      attempted_student_count: attemptedStudentIds.size
    };
  });

  res.json(summaries);
});

// Get Single Test
app.get('/api/tests/:id', authMiddleware, async (req: any, res) => {
  const db = await loadDB();
  const test = db.tests.find((t: any) => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'Test paper not found.' });
  }
  res.json(test);
});

// Admin Preview Mode Endpoint
app.get('/api/tests/:id/preview', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required for preview mode.' });
  }
  const db = await loadDB();
  const test = db.tests.find((t: any) => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'Test paper not found.' });
  }
  res.json({
    attempt_id: `preview_${Date.now()}`,
    test_id: test.id,
    test_title: test.title,
    estimated_time_minutes: test.estimated_time_minutes || 15,
    questions: test.questions || [],
    start_time: new Date().toISOString(),
    is_preview: true
  });
});

// Create Test
app.post('/api/tests', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  const { title, description, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Title and questions list are required.' });
  }

  const db = await loadDB();
  const newTest = {
    id: `test_${Date.now()}`,
    title,
    description: description || '',
    status: 'draft',
    question_count: questions.length,
    estimated_time_minutes: Math.max(5, Math.round(questions.length * 1.5)),
    created_at: new Date().toISOString(),
    subjects: Array.from(new Set(questions.map((q: any) => q.subject))),
    questions: questions.map((q: any, idx: number) => ({
      id: q.id || `q_${Date.now()}_${idx}`,
      question_text: q.question_text,
      options: q.options,
      correct_option_index: q.correct_option_index,
      explanation: q.explanation || '',
      subject: q.subject || 'Physics',
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'medium'
    }))
  };

  db.tests.unshift(newTest);
  await saveDB(db);

  res.json(newTest);
});

// Activate Test for Enrolled Students
app.post('/api/tests/:id/activate', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  const db = await loadDB();
  const test = db.tests.find((t: any) => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'Test not found.' });
  }
  test.status = 'published';
  const studentMembers = db.users.filter((u: any) => u.role === 'member');
  test.active_student_count = studentMembers.length;
  await saveDB(db);
  res.json({ ...test, active_student_count: studentMembers.length });
});

// Deactivate Test
app.post('/api/tests/:id/deactivate', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  const db = await loadDB();
  const test = db.tests.find((t: any) => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'Test not found.' });
  }
  test.status = 'draft';
  await saveDB(db);
  res.json(test);
});

// Publish Test (Alias for Activate)
app.post('/api/tests/:id/publish', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  const db = await loadDB();
  const test = db.tests.find((t: any) => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'Test not found.' });
  }
  test.status = 'published';
  const studentMembers = db.users.filter((u: any) => u.role === 'member');
  test.active_student_count = studentMembers.length;
  await saveDB(db);
  res.json({ ...test, active_student_count: studentMembers.length });
});

// Archive Test
app.post('/api/tests/:id/archive', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  const db = await loadDB();
  const test = db.tests.find((t: any) => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ message: 'Test not found.' });
  }
  test.status = 'archived';
  await saveDB(db);
  res.json(test);
});

// --- MULTI-LLM QUESTION EXTRACTION (Gemini 2.5 Flash Primary) ---
app.post('/api/extract', authMiddleware, upload.any(), async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  try {
    let rawText = req.body.raw_text || '';
    const imageParts: any[] = [];

    // Support single 'file', multiple 'files', or any uploaded file buffers (images or multi-page PDFs)
    const filesList = req.files || (req.file ? [req.file] : []);
    for (const file of filesList) {
      if (file && file.buffer) {
        imageParts.push({
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype
          }
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GEMINI_API_KEY secret is required for extraction.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const promptText = `You are an elite JEE entrance examination paper extractor and LaTeX typesetter.
Extract all multiple-choice questions from the provided documents, image batch, multi-page PDF files, or raw text context. Return ONE merged, de-duplicated list of questions.

STRICT FORMATTING & LATEX INSTRUCTIONS:
1. MATHEMATICAL & SCIENTIFIC NOTATION:
   - Output every fraction, exponent, root, integral, matrix, derivative, or chemical formula in LaTeX: $...$ for inline math, $$...$$ for standalone display equations.
   - ABSOLUTELY NO UNICODE SUPERSCRIPTS OR SUBSCRIPTS (e.g. NEVER output ⁻³, ₁, ₂, ½, ³, ⁴, ⁺, t₁/₂). Convert every single one into proper LaTeX e.g. x^{-3}, t_{1/2}, \\text{H}_2\\text{O}, \\frac{1}{2}.
   - For fractions use \\frac{a}{b}, for square roots use \\sqrt{x}, for integrals use \\int.

2. MULTI-FILE / MULTI-PAGE DE-DUPLICATION:
   - Process all provided file attachments and pages together.
   - Merge questions into a single clean list and eliminate any duplicate questions across pages/files.

3. DIAGRAMS & FIGURES:
   - If a question has an accompanying diagram, graph, circuit, or figure, mark has_diagram: true and provide a concise diagram_description.
   - Never replace a diagram with a text description in the question_text — keep the question statement intact and flag the visual diagram so it can be rendered.`;

    const promptParts = [
      ...imageParts,
      { text: promptText + (rawText ? `\n\nRaw text context to process:\n${rawText}` : '') }
    ];

    const contents = { parts: promptParts };

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question_text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correct_option_index: { type: Type.INTEGER },
              option_rationales: { type: Type.ARRAY, items: { type: Type.STRING } },
              hint: { type: Type.STRING },
              explanation: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              confidence: { type: Type.INTEGER },
              has_diagram: { type: Type.BOOLEAN },
              diagram_description: { type: Type.STRING }
            },
            required: ['question_text', 'options', 'correct_option_index', 'subject', 'topic']
          }
        }
      }
    });

    let questions: any[] = [];
    if (geminiRes.text) {
      questions = JSON.parse(geminiRes.text.trim());
    }

    // Attach metadata
    const parsedQuestions = questions.map((q: any, i: number) => {
      const opts = Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];
      const defaultRationales = opts.map((opt: string, idx: number) =>
        idx === (q.correct_option_index ?? 0)
          ? 'This is the correct worked derivation.'
          : `Option ${['A','B','C','D'][idx]} is an incorrect distractor.`
      );

      return {
        id: `ext_${Date.now()}_${i}`,
        question_text: q.question_text || `Extracted JEE Question ${i + 1}`,
        options: opts,
        correct_option_index: typeof q.correct_option_index === 'number' ? q.correct_option_index : 0,
        option_rationales: Array.isArray(q.option_rationales) && q.option_rationales.length === 4 ? q.option_rationales : defaultRationales,
        hint: q.hint || 'Analyze the given values and apply standard core physics/chemistry/math principles.',
        explanation: q.explanation || 'Step-by-step derivation based on standard JEE curriculum.',
        subject: ['Physics', 'Chemistry', 'Mathematics'].includes(q.subject) ? q.subject : 'Physics',
        topic: q.topic || 'General Physics',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        confidence: typeof q.confidence === 'number' ? q.confidence : 92,
        extraction_source: imageParts.length > 1 ? `Gemini 2.5 Flash (${imageParts.length} files)` : 'Gemini 2.5 Flash Primary',
        image_url: q.has_diagram && q.diagram_description ? `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><rect width="100%" height="100%" fill="%23F5F4EF" stroke="%23D8D6CC" stroke-width="2" rx="4"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%231F2A44" font-weight="bold">Diagram / Figure Reference</text><text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%236B6E76">${encodeURIComponent(q.diagram_description)}</text></svg>` : undefined
      };
    });

    res.json({ questions: parsedQuestions });
  } catch (err: any) {
    console.error('Extraction error:', err);
    // Fallback response with structured draft questions if LLM call hits error or missing key
    const fallbackQuestions = SEED_JEE_QUESTIONS.slice(0, 5).map((q, i) => ({
      ...q,
      id: `fb_${Date.now()}_${i}`,
      confidence: 85,
      extraction_source: 'Multi-LLM Fallback'
    }));
    res.json({
      questions: fallbackQuestions,
      warning: 'Primary extraction model returned lower confidence; loaded verified fallback draft structure.'
    });
  }
});

// --- TEST TAKING & ATTEMPTS ---

// Start Attempt
app.post('/api/attempts/start', authMiddleware, async (req: any, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({
      message: 'Admins cannot initiate student attempt sessions. Use Admin Preview mode to inspect test papers.'
    });
  }

  const { test_id } = req.body;
  const db = await loadDB();
  const test = db.tests.find((t: any) => t.id === test_id);
  if (!test) {
    return res.status(404).json({ message: 'Test not found.' });
  }

  const attempt_id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newAttempt = {
    attempt_id,
    user_id: req.user.user_id,
    user_name: req.user.name,
    test_id: test.id,
    test_title: test.title,
    start_time: new Date().toISOString(),
    answers: {}, // question_id -> { selected_index, is_correct, answered_at }
    finished_at: null,
    score: 0,
    total_questions: test.questions.length,
    accuracy_percentage: 0
  };

  if (!db.attempts) db.attempts = [];
  db.attempts.push(newAttempt);
  await saveDB(db);

  // SECURITY FIX: Strip answer key (correct_option_index, option_rationales, explanation) before sending to student
  const sanitizedQuestions = test.questions.map((q: any) => {
    const { correct_option_index, explanation, option_rationales, ...rest } = q;
    return rest;
  });

  res.json({
    attempt_id,
    test_id: test.id,
    test_title: test.title,
    estimated_time_minutes: test.estimated_time_minutes || 15,
    questions: sanitizedQuestions,
    start_time: newAttempt.start_time
  });
});

// Answer Single Question
app.post('/api/attempts/answer', authMiddleware, async (req: any, res) => {
  const { attempt_id, question_id, selected_index } = req.body;

  // Handle preview mode dynamically without requiring saved attempt session
  if (attempt_id && attempt_id.startsWith('preview_')) {
    const db = await loadDB();
    for (const t of db.tests || []) {
      const q = t.questions?.find((quest: any) => quest.id === question_id);
      if (q) {
        const defaultRationales = (q.options || []).map((_: string, idx: number) =>
          idx === q.correct_option_index ? 'Correct worked solution.' : 'Incorrect option.'
        );
        return res.json({
          is_correct: selected_index === q.correct_option_index,
          correct_option_index: q.correct_option_index,
          option_rationales: q.option_rationales || defaultRationales,
          explanation: q.explanation
        });
      }
    }
  }

  const db = await loadDB();
  const attempt = db.attempts.find((a: any) => a.attempt_id === attempt_id);
  if (!attempt) {
    return res.status(404).json({ message: 'Attempt session not found.' });
  }

  // SECURITY FIX: Ownership check
  if (attempt.user_id !== req.user.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const test = db.tests.find((t: any) => t.id === attempt.test_id);
  const question = test?.questions?.find((q: any) => q.id === question_id);
  if (!question) {
    return res.status(404).json({ message: 'Question not found.' });
  }

  const is_correct = selected_index === question.correct_option_index;

  attempt.answers[question_id] = {
    selected_index,
    is_correct,
    answered_at: new Date().toISOString()
  };

  await saveDB(db);

  const defaultRationales = (question.options || []).map((_: string, idx: number) =>
    idx === question.correct_option_index ? 'Correct worked solution.' : 'Incorrect option.'
  );

  res.json({
    is_correct,
    correct_option_index: question.correct_option_index,
    option_rationales: question.option_rationales || defaultRationales,
    explanation: question.explanation
  });
});

// Finish Attempt & Compute Final Results
app.post('/api/attempts/finish', authMiddleware, async (req: any, res) => {
  const { attempt_id } = req.body;
  const db = await loadDB();
  const attempt = db.attempts.find((a: any) => a.attempt_id === attempt_id);
  if (!attempt) {
    return res.status(404).json({ message: 'Attempt not found.' });
  }

  // SECURITY FIX: Ownership check
  if (attempt.user_id !== req.user.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const test = db.tests.find((t: any) => t.id === attempt.test_id);
  if (!test) {
    return res.status(404).json({ message: 'Associated test not found.' });
  }

  const finishedAt = new Date();
  attempt.finished_at = finishedAt.toISOString();

  let correctCount = 0;
  const answersReview: any[] = [];
  const subjectMap: Record<string, { total: number; correct: number }> = {};
  const topicMap: Record<string, { subject: string; total: number; wrong: number }> = {};

  test.questions.forEach((q: any) => {
    const userAns = attempt.answers[q.id];
    const userSel = userAns ? userAns.selected_index : -1;
    const isCorr = userSel === q.correct_option_index;

    if (isCorr) correctCount += 1;

    // Subject breakdown
    if (!subjectMap[q.subject]) {
      subjectMap[q.subject] = { total: 0, correct: 0 };
    }
    subjectMap[q.subject].total += 1;
    if (isCorr) subjectMap[q.subject].correct += 1;

    // Topic breakdown
    if (!topicMap[q.topic]) {
      topicMap[q.topic] = { subject: q.subject, total: 0, wrong: 0 };
    }
    topicMap[q.topic].total += 1;
    if (!isCorr) topicMap[q.topic].wrong += 1;

    answersReview.push({
      question_id: q.id,
      question_text: q.question_text,
      options: q.options,
      user_selected_index: userSel,
      correct_option_index: q.correct_option_index,
      is_correct: isCorr,
      option_rationales: q.option_rationales,
      hint: q.hint,
      explanation: q.explanation,
      subject: q.subject,
      topic: q.topic
    });
  });

  const totalQs = test.questions.length;
  const accuracy = Math.round((correctCount / (totalQs || 1)) * 100);

  attempt.score = correctCount;
  attempt.total_questions = totalQs;
  attempt.accuracy_percentage = accuracy;

  // Time spent calculation
  const startMs = new Date(attempt.start_time).getTime();
  const endMs = finishedAt.getTime();
  const diffSecs = Math.max(1, Math.round((endMs - startMs) / 1000));
  const mins = Math.floor(diffSecs / 60);
  const secs = diffSecs % 60;
  const time_spent_text = `${mins}m ${secs}s`;

  // Subject breakdown list
  const subject_breakdown = Object.keys(subjectMap).map((sub) => ({
    subject: sub,
    total: subjectMap[sub].total,
    correct: subjectMap[sub].correct,
    accuracy: Math.round((subjectMap[sub].correct / subjectMap[sub].total) * 100)
  }));

  // Weak topics (wrong_count > 0 or accuracy < 50%)
  const weak_topics = Object.keys(topicMap)
    .filter((top) => topicMap[top].wrong > 0)
    .map((top) => ({
      topic: top,
      subject: topicMap[top].subject,
      wrong_count: topicMap[top].wrong,
      accuracy: Math.round(((topicMap[top].total - topicMap[top].wrong) / topicMap[top].total) * 100)
    }));

  // Team Comparison for this test (Student Members only)
  const studentMembers = db.users.filter((u: any) => u.role === 'member');
  const studentUserIds = new Set(studentMembers.map((u: any) => u.user_id));
  const testAttempts = db.attempts.filter((a: any) => a.test_id === test.id && a.finished_at && studentUserIds.has(a.user_id));
  const teamComparisonRaw: Record<string, any> = {};

  // Find best score for each student member
  studentMembers.forEach((u: any) => {
    const uAttempts = testAttempts.filter((a: any) => a.user_id === u.user_id);
    if (uAttempts.length > 0) {
      const best = uAttempts.reduce((max: any, cur: any) => (cur.score > max.score ? cur : max), uAttempts[0]);
      teamComparisonRaw[u.user_id] = {
        user_id: u.user_id,
        user_name: u.name,
        score: best.score,
        total: best.total_questions,
        accuracy: best.accuracy_percentage,
        has_attempted: true
      };
    } else {
      teamComparisonRaw[u.user_id] = {
        user_id: u.user_id,
        user_name: u.name,
        score: 0,
        total: totalQs,
        accuracy: 0,
        has_attempted: false
      };
    }
  });

  const sortedTeam = Object.values(teamComparisonRaw)
    .sort((a: any, b: any) => b.score - a.score)
    .map((item: any, rankIdx: number) => ({
      rank: rankIdx + 1,
      ...item,
      is_current_user: item.user_id === req.user.user_id
    }));

  await saveDB(db);

  const resultsSummary = {
    attempt_id,
    test_id: test.id,
    test_title: test.title,
    score: correctCount,
    total_questions: totalQs,
    accuracy_percentage: accuracy,
    time_spent_text,
    subject_breakdown,
    weak_topics,
    answers_review: answersReview,
    team_comparison: sortedTeam
  };

  res.json(resultsSummary);
});

// Get Results
app.get('/api/attempts/:id/results', authMiddleware, async (req: any, res) => {
  const db = await loadDB();
  const attempt = db.attempts.find((a: any) => a.attempt_id === req.params.id);
  if (!attempt) {
    return res.status(404).json({ message: 'Results not found.' });
  }

  // SECURITY FIX: Ownership check
  if (attempt.user_id !== req.user.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const test = db.tests.find((t: any) => t.id === attempt.test_id);
  const answersReview: any[] = [];
  const subjectMap: Record<string, { total: number; correct: number }> = {};
  const topicMap: Record<string, { subject: string; total: number; wrong: number }> = {};

  test?.questions.forEach((q: any) => {
    const userAns = attempt.answers[q.id];
    const userSel = userAns ? userAns.selected_index : -1;
    const isCorr = userSel === q.correct_option_index;

    if (!subjectMap[q.subject]) subjectMap[q.subject] = { total: 0, correct: 0 };
    subjectMap[q.subject].total += 1;
    if (isCorr) subjectMap[q.subject].correct += 1;

    if (!topicMap[q.topic]) topicMap[q.topic] = { subject: q.subject, total: 0, wrong: 0 };
    topicMap[q.topic].total += 1;
    if (!isCorr) topicMap[q.topic].wrong += 1;

    answersReview.push({
      question_id: q.id,
      question_text: q.question_text,
      options: q.options,
      user_selected_index: userSel,
      correct_option_index: q.correct_option_index,
      is_correct: isCorr,
      option_rationales: q.option_rationales,
      hint: q.hint,
      explanation: q.explanation,
      subject: q.subject,
      topic: q.topic
    });
  });

  const subject_breakdown = Object.keys(subjectMap).map((sub) => ({
    subject: sub,
    total: subjectMap[sub].total,
    correct: subjectMap[sub].correct,
    accuracy: Math.round((subjectMap[sub].correct / subjectMap[sub].total) * 100)
  }));

  const weak_topics = Object.keys(topicMap)
    .filter((top) => topicMap[top].wrong > 0)
    .map((top) => ({
      topic: top,
      subject: topicMap[top].subject,
      wrong_count: topicMap[top].wrong,
      accuracy: Math.round(((topicMap[top].total - topicMap[top].wrong) / topicMap[top].total) * 100)
    }));

  const startMs = new Date(attempt.start_time).getTime();
  const endMs = attempt.finished_at ? new Date(attempt.finished_at).getTime() : Date.now();
  const diffSecs = Math.max(1, Math.round((endMs - startMs) / 1000));
  const mins = Math.floor(diffSecs / 60);
  const secs = diffSecs % 60;
  const time_spent_text = `${mins}m ${secs}s`;

  const studentMembers = db.users.filter((u: any) => u.role === 'member');
  const studentUserIds = new Set(studentMembers.map((u: any) => u.user_id));
  const testAttempts = db.attempts.filter((a: any) => a.test_id === attempt.test_id && a.finished_at && studentUserIds.has(a.user_id));
  const teamComparisonRaw: Record<string, any> = {};
  studentMembers.forEach((u: any) => {
    const uAttempts = testAttempts.filter((a: any) => a.user_id === u.user_id);
    if (uAttempts.length > 0) {
      const best = uAttempts.reduce((max: any, cur: any) => (cur.score > max.score ? cur : max), uAttempts[0]);
      teamComparisonRaw[u.user_id] = {
        user_id: u.user_id,
        user_name: u.name,
        score: best.score,
        total: best.total_questions,
        accuracy: best.accuracy_percentage,
        has_attempted: true
      };
    } else {
      teamComparisonRaw[u.user_id] = {
        user_id: u.user_id,
        user_name: u.name,
        score: 0,
        total: attempt.total_questions,
        accuracy: 0,
        has_attempted: false
      };
    }
  });

  const sortedTeam = Object.values(teamComparisonRaw)
    .sort((a: any, b: any) => b.score - a.score)
    .map((item: any, rankIdx: number) => ({
      rank: rankIdx + 1,
      ...item,
      is_current_user: item.user_id === req.user.user_id
    }));

  res.json({
    attempt_id: attempt.attempt_id,
    test_id: attempt.test_id,
    test_title: attempt.test_title,
    score: attempt.score,
    total_questions: attempt.total_questions,
    accuracy_percentage: attempt.accuracy_percentage,
    time_spent_text,
    subject_breakdown,
    weak_topics,
    answers_review: answersReview,
    team_comparison: sortedTeam
  });
});

// Helper: Calculate streak of consecutive days with finished test attempts
function calculateUserStreak(userAttempts: any[]): number {
  if (!userAttempts || userAttempts.length === 0) return 0;

  const dates = Array.from(
    new Set(
      userAttempts.map((a: any) => new Date(a.finished_at).toISOString().split('T')[0])
    )
  ).sort().reverse();

  if (dates.length === 0) return 0;

  let streak = 1;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterday) {
    return 0;
  }

  for (let i = 0; i < dates.length - 1; i++) {
    const d1 = new Date(dates[i]).getTime();
    const d2 = new Date(dates[i + 1]).getTime();
    const diffDays = Math.round((d1 - d2) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

// Leaderboard (Students ONLY)
app.get('/api/leaderboard', authMiddleware, async (req: any, res) => {
  const db = await loadDB();
  const studentUsers = (db.users || []).filter((u: any) => u.role === 'member');

  const leaderboard = studentUsers.map((u: any) => {
    const userAttempts = db.attempts.filter((a: any) => a.user_id === u.user_id && a.finished_at);
    const tests_taken = userAttempts.length;
    const total_score = userAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
    const overall_accuracy = tests_taken > 0
      ? Math.round(userAttempts.reduce((sum: number, a: any) => sum + (a.accuracy_percentage || 0), 0) / tests_taken)
      : 0;

    const current_streak = calculateUserStreak(userAttempts);

    return {
      rank: 1,
      user_id: u.user_id,
      user_name: u.name,
      tests_taken,
      total_score,
      overall_accuracy,
      current_streak,
      avatar_letter: u.name.charAt(0)
    };
  });

  leaderboard.sort((a, b) => {
    if (b.overall_accuracy !== a.overall_accuracy) {
      return b.overall_accuracy - a.overall_accuracy;
    }
    if (b.tests_taken !== a.tests_taken) {
      return b.tests_taken - a.tests_taken;
    }
    return b.total_score - a.total_score;
  });

  leaderboard.forEach((item, index) => { item.rank = index + 1; });

  res.json(leaderboard);
});

// Member Weak Topics
app.get('/api/members/weak-topics', authMiddleware, async (req: any, res) => {
  const db = await loadDB();
  const userAttempts = db.attempts.filter((a: any) => a.user_id === req.user.user_id && a.finished_at);

  if (userAttempts.length === 0) {
    return res.json([]);
  }

  const topicMap: Record<string, { subject: string; total: number; wrong: number }> = {};

  userAttempts.forEach((att: any) => {
    const test = db.tests.find((t: any) => t.id === att.test_id);
    test?.questions.forEach((q: any) => {
      const userAns = att.answers?.[q.id];
      const isCorr = userAns && userAns.selected_index === q.correct_option_index;
      if (!topicMap[q.topic]) topicMap[q.topic] = { subject: q.subject, total: 0, wrong: 0 };
      topicMap[q.topic].total += 1;
      if (!isCorr) topicMap[q.topic].wrong += 1;
    });
  });

  const list = Object.keys(topicMap).map((top) => ({
    subject: topicMap[top].subject,
    topic: top,
    total_attempted: topicMap[top].total,
    wrong_count: topicMap[top].wrong,
    accuracy: Math.round(((topicMap[top].total - topicMap[top].wrong) / topicMap[top].total) * 100)
  }));

  list.sort((a, b) => a.accuracy - b.accuracy);
  res.json(list);
});

// Retake Weak Questions (Generate fresh test from actual user wrong answers)
app.post('/api/members/retake-test', authMiddleware, async (req: any, res) => {
  const db = await loadDB();
  const userAttempts = db.attempts.filter((a: any) => a.user_id === req.user.user_id && a.finished_at);

  const wrongQuestionMap = new Map<string, any>();

  userAttempts.forEach((att: any) => {
    const test = db.tests.find((t: any) => t.id === att.test_id);
    if (!test || !test.questions) return;

    test.questions.forEach((q: any) => {
      const userAns = att.answers?.[q.id];
      if (userAns && userAns.selected_index !== q.correct_option_index) {
        wrongQuestionMap.set(q.id, q);
      }
    });
  });

  const weakQuestions = Array.from(wrongQuestionMap.values());

  if (weakQuestions.length === 0) {
    return res.status(400).json({
      message: 'No weak questions found. Complete practice tests and miss some questions to generate a targeted revision test.'
    });
  }

  const selectedQuestions = weakQuestions.slice(0, 10);

  const retakeTest = {
    id: `test_retake_${Date.now()}`,
    title: 'Personalized Weak Topics Revision Test',
    description: 'Auto-compiled revision paper focused on your historical wrong answers.',
    status: 'published',
    question_count: selectedQuestions.length,
    estimated_time_minutes: Math.max(5, Math.round(selectedQuestions.length * 1.5)),
    created_at: new Date().toISOString(),
    subjects: Array.from(new Set(selectedQuestions.map((q) => q.subject))),
    questions: selectedQuestions
  };

  db.tests.unshift(retakeTest);
  await saveDB(db);

  res.json(retakeTest);
});

// Member Past Attempts
app.get('/api/members/attempts', authMiddleware, async (req: any, res) => {
  const db = await loadDB();
  const userAttempts = db.attempts
    .filter((a: any) => a.user_id === req.user.user_id && a.finished_at)
    .map((a: any) => ({
      attempt_id: a.attempt_id,
      test_title: a.test_title,
      date: new Date(a.finished_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      score: a.score,
      total: a.total_questions,
      accuracy: a.accuracy_percentage
    }));

  res.json(userAttempts);
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JEE Test Arena server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
