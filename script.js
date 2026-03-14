const STORAGE_KEY = 'licQuizState.v1';

const state = {
  cleanedQuestions: [],
  questionLookup: {},
  correctedQuestions: [],
  flaggedQuestions: [],
  correctionLogs: [],
  activeView: 'home',
  mode: 'study',
  topic: 'all',
  queue: [],
  currentIndex: 0,
  answered: {},
  wrongIds: [],
  score: { attempted: 0, correct: 0, wrong: 0 },
  quizStarted: false
};

const el = {
  home: document.getElementById('homeScreen'),
  quiz: document.getElementById('quizScreen'),
  results: document.getElementById('resultsScreen'),
  mistakes: document.getElementById('mistakesScreen'),
  review: document.getElementById('reviewScreen'),
  badge: document.getElementById('sessionBadge'),
  statTpl: document.getElementById('statCardTemplate')
};

init();

async function init() {
  await loadData();
  hydrateState();
  renderHome();
  renderReviewPanel();
  setView('home');
}

async function loadData() {
  const [cleaned, corrected, flagged, logs] = await Promise.all([
    fetch('cleaned_questions.json').then(r => r.json()),
    fetch('corrected_questions.json').then(r => r.json()),
    fetch('flagged_questions.json').then(r => r.json()),
    fetch('corrections_log.json').then(r => r.json())
  ]);
  state.cleanedQuestions = normalizeCleanedQuestions(cleaned);
  state.questionLookup = Object.fromEntries(state.cleanedQuestions.map(q => [q.id, q]));
  state.correctedQuestions = corrected;
  state.flaggedQuestions = flagged;
  state.correctionLogs = logs;
}

function normalizeCleanedQuestions(cleaned) {
  if (!Array.isArray(cleaned)) return [];
  return cleaned
    .filter(item => item && item.id && item.question && Array.isArray(item.options) && item.options.length)
    .map(item => {
      const answerIndex = Number.isInteger(item.answer) ? item.answer - 1 : parseAnswerValue(item.answer);
      const safeAnswerIndex = answerIndex >= 0 && answerIndex < item.options.length ? answerIndex : 0;
      const topic = inferTopic(item);
      return {
        ...item,
        topic,
        correctAnswerIndex: safeAnswerIndex,
        correctAnswerText: item.options[safeAnswerIndex],
        explanationShort: item.explanationShort || item.explanation || `Correct answer: ${item.options[safeAnswerIndex]}`,
        mnemonicTip: item.mnemonicTip || item.memoryTip || 'Re-read this question and compare all options carefully.'
      };
    });
}

function parseAnswerValue(answer) {
  if (typeof answer === 'number') return answer;
  if (typeof answer !== 'string') return 0;
  const trimmed = answer.trim().toUpperCase();
  const letterMap = { A: 0, B: 1, C: 2, D: 3 };
  if (trimmed in letterMap) return letterMap[trimmed];
  const numeric = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(numeric)) {
    return numeric > 0 ? numeric - 1 : numeric;
  }
  return 0;
}

function inferTopic(item) {
  if (item.topic && String(item.topic).trim()) return String(item.topic).trim();
  const fromSource = String(item.sourceTextFile || '')
    .split('/')
    .pop()
    .replace('_pagewise.txt', '')
    .trim();
  return fromSource || 'General LIC';
}

function hydrateState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    mode: state.mode,
    topic: state.topic,
    queue: state.queue,
    currentIndex: state.currentIndex,
    answered: state.answered,
    wrongIds: state.wrongIds,
    score: state.score,
    quizStarted: state.quizStarted
  }));
}

function setView(view) {
  state.activeView = view;
  Object.entries({ home: el.home, quiz: el.quiz, results: el.results, mistakes: el.mistakes, review: el.review })
    .forEach(([key, node]) => node.classList.toggle('active', key === view));
  el.badge.textContent = state.quizStarted
    ? `Mode: ${state.mode.toUpperCase()} · Attempted: ${state.score.attempted}`
    : 'No active session';
}

function deriveMeta() {
  const topics = new Set(state.cleanedQuestions.map(q => q.topic));
  const verifiedCount = state.cleanedQuestions.filter(q => q.status === 'verified').length;
  const correctedCount = state.cleanedQuestions.filter(q => q.status === 'corrected').length;
  const weakAreas = getWeakAreas();
  return { topics, verifiedCount, correctedCount, weakAreas };
}

function renderHome() {
  const { topics, verifiedCount, correctedCount, weakAreas } = deriveMeta();
  el.home.innerHTML = `
    <div class="card">
      <h2>Dashboard Home</h2>
      <p class="small">Study-ready dataset excludes flagged questions and exact duplicates.</p>
      <div class="grid" id="statsGrid"></div>
      <div class="controls">
        <div>
          <label for="modeSelect">Mode</label>
          <select id="modeSelect">
            <option value="study">Study Mode (instant feedback)</option>
            <option value="exam">Exam Mode (results at end)</option>
          </select>
        </div>
        <div>
          <label for="topicSelect">Topic filter</label>
          <select id="topicSelect"></select>
        </div>
      </div>
      <div class="btn-row">
        <button class="primary" id="startQuizBtn">Start Quiz</button>
        <button class="ghost" id="continueBtn">Continue Last Session</button>
        <button class="ghost" id="mistakesBtn">Review Mistakes</button>
        <button class="ghost" id="reviewBtn">Developer Review Panel</button>
      </div>
      <p class="small" id="weakAreaLine"></p>
    </div>
  `;

  const stats = [
    ['Total cleaned questions', state.cleanedQuestions.length],
    ['Topics', topics.size],
    ['Verified in final quiz', verifiedCount],
    ['Corrected in final quiz', correctedCount],
    ['Flagged for review', state.flaggedQuestions.length]
  ];
  const statsGrid = document.getElementById('statsGrid');
  stats.forEach(([k, v]) => {
    const clone = el.statTpl.content.cloneNode(true);
    clone.querySelector('h3').textContent = k;
    clone.querySelector('p').textContent = v;
    statsGrid.appendChild(clone);
  });

  const modeSelect = document.getElementById('modeSelect');
  modeSelect.value = state.mode;
  modeSelect.onchange = e => {
    state.mode = e.target.value;
    persistState();
  };

  const topicSelect = document.getElementById('topicSelect');
  const options = ['all', 'mixed', ...Array.from(topics).sort()];
  topicSelect.innerHTML = options.map(t => `<option value="${t}">${t === 'all' ? 'All Questions' : t === 'mixed' ? 'Mixed Practice Mode' : t}</option>`).join('');
  topicSelect.value = state.topic;
  topicSelect.onchange = e => {
    state.topic = e.target.value;
    persistState();
  };

  document.getElementById('startQuizBtn').onclick = () => startQuiz(true);
  document.getElementById('continueBtn').onclick = () => continueQuiz();
  document.getElementById('mistakesBtn').onclick = () => renderMistakes();
  document.getElementById('reviewBtn').onclick = () => {
    renderReviewPanel();
    setView('review');
  };

  document.getElementById('weakAreaLine').textContent = weakAreas.length
    ? `Weak area summary: ${weakAreas.join(', ')}`
    : 'Weak area summary: Attempt more questions to generate analytics.';
}

function buildQueue(topic) {
  let questions = [...state.cleanedQuestions];
  if (topic !== 'all' && topic !== 'mixed') {
    questions = questions.filter(q => q.topic === topic);
  }
  if (topic === 'mixed') {
    questions.sort(() => Math.random() - 0.5);
  }
  return questions.map(q => q.id);
}

function startQuiz(reset) {
  state.queue = buildQueue(state.topic);
  if (!state.queue.length) return;
  if (reset) {
    state.currentIndex = 0;
    state.answered = {};
    state.wrongIds = [];
    state.score = { attempted: 0, correct: 0, wrong: 0 };
  }
  state.quizStarted = true;
  persistState();
  renderQuiz();
  setView('quiz');
}

function continueQuiz() {
  if (!state.quizStarted || !state.queue.length) {
    startQuiz(true);
    return;
  }
  renderQuiz();
  setView('quiz');
}

function renderQuiz() {
  const id = state.queue[state.currentIndex];
  const q = state.questionLookup[id];
  if (!q) {
    renderResults();
    return;
  }

  const pct = ((state.currentIndex) / state.queue.length) * 100;
  const priorAnswer = state.answered[q.id];

  el.quiz.innerHTML = `
    <div class="card">
      <h2>Quiz</h2>
      <p class="small">${state.mode === 'study' ? 'Immediate feedback is enabled.' : 'Exam mode hides correctness until completion.'}</p>
      <div class="progress"><div style="width:${pct}%;"></div></div>
      <p class="small">Question ${state.currentIndex + 1} of ${state.queue.length} · <span class="topic-chip">${q.topic}</span></p>
      <div class="question-title">${q.question}</div>
      <div class="options" id="optionsContainer"></div>
      <div id="feedbackBox"></div>
      <div class="btn-row">
        <button class="ghost" id="homeBtn">Back Home</button>
        <button class="primary" id="nextBtn" ${priorAnswer === undefined ? 'disabled' : ''}>${state.currentIndex + 1 === state.queue.length ? 'Finish Quiz' : 'Next Question'}</button>
      </div>
    </div>
  `;

  const optionContainer = document.getElementById('optionsContainer');
  q.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${String.fromCharCode(65 + index)}. ${opt}`;
    if (priorAnswer !== undefined) {
      styleAnsweredOption(btn, q, index, priorAnswer);
      btn.disabled = true;
    }
    btn.onclick = () => handleAnswer(q, index);
    optionContainer.appendChild(btn);
  });

  if (priorAnswer !== undefined && state.mode === 'study') {
    renderStudyFeedback(q, priorAnswer);
  }

  document.getElementById('homeBtn').onclick = () => {
    renderHome();
    setView('home');
  };
  document.getElementById('nextBtn').onclick = () => {
    if (state.currentIndex + 1 >= state.queue.length) {
      renderResults();
    } else {
      state.currentIndex += 1;
      persistState();
      renderQuiz();
    }
  };
}

function handleAnswer(q, selectedIndex) {
  if (state.answered[q.id] !== undefined) return;

  state.answered[q.id] = selectedIndex;
  state.score.attempted += 1;

  const isCorrect = selectedIndex === q.correctAnswerIndex;
  if (isCorrect) state.score.correct += 1;
  else {
    state.score.wrong += 1;
    state.wrongIds.push(q.id);
  }

  persistState();

  if (state.mode === 'study') {
    renderQuiz();
  } else {
    document.getElementById('nextBtn').disabled = false;
    Array.from(document.querySelectorAll('.option-btn')).forEach(b => b.disabled = true);
  }
}

function styleAnsweredOption(btn, q, idx, selected) {
  if (idx === selected && idx === q.correctAnswerIndex) btn.classList.add('correct');
  else if (idx === selected && idx !== q.correctAnswerIndex) btn.classList.add('wrong');
  else if (idx === q.correctAnswerIndex) btn.classList.add('reveal');
}

function renderStudyFeedback(q, selected) {
  const fb = document.getElementById('feedbackBox');
  const correct = selected === q.correctAnswerIndex;
  fb.innerHTML = `
    <div class="feedback ${correct ? 'ok' : 'bad'}">
      <strong>${correct ? 'Correct ✅' : 'Incorrect ❌'}</strong>
      <div>${correct ? q.explanationShort : `Correct answer: ${q.correctAnswerText}`}</div>
      ${correct ? '' : `<div class="small">Memory tip: ${q.mnemonicTip}</div>`}
    </div>
  `;
  document.getElementById('nextBtn').disabled = false;
}

function renderResults() {
  const total = state.queue.length;
  const pct = total ? Math.round((state.score.correct / total) * 100) : 0;
  const topicStats = {};
  state.queue.forEach(id => {
    const q = state.questionLookup[id];
    if (!q) return;
    topicStats[q.topic] ??= { total: 0, correct: 0 };
    topicStats[q.topic].total += 1;
    if (state.answered[id] === q.correctAnswerIndex) topicStats[q.topic].correct += 1;
  });

  el.results.innerHTML = `
    <div class="card">
      <h2>Final Results</h2>
      <div class="grid" id="resultStats"></div>
      <h3>Topic-wise Performance</h3>
      <div id="topicPerf"></div>
      <div class="btn-row">
        <button class="primary" id="retryWrongBtn">Retry Wrong Answers Only</button>
        <button class="ghost" id="restartBtn">Restart Full Quiz</button>
        <button class="ghost" id="homeFromResultBtn">Back Home</button>
      </div>
    </div>
  `;

  [['Total Correct', state.score.correct], ['Total Wrong', state.score.wrong], ['Attempted', state.score.attempted], ['Percentage', `${pct}%`]]
    .forEach(([k, v]) => {
      const clone = el.statTpl.content.cloneNode(true);
      clone.querySelector('h3').textContent = k;
      clone.querySelector('p').textContent = v;
      document.getElementById('resultStats').appendChild(clone);
    });

  const topicPerf = document.getElementById('topicPerf');
  topicPerf.innerHTML = Object.entries(topicStats)
    .map(([topic, data]) => `<div class="list-card"><strong>${topic}</strong><div class="small">${data.correct}/${data.total} correct (${Math.round((data.correct / data.total) * 100)}%)</div></div>`)
    .join('') || '<p class="small">No topic data available.</p>';

  document.getElementById('retryWrongBtn').onclick = () => retryWrong();
  document.getElementById('restartBtn').onclick = () => startQuiz(true);
  document.getElementById('homeFromResultBtn').onclick = () => {
    renderHome();
    setView('home');
  };

  state.quizStarted = false;
  persistState();
  setView('results');
}

function retryWrong() {
  if (!state.wrongIds.length) return;
  state.queue = [...new Set(state.wrongIds)];
  state.currentIndex = 0;
  state.answered = {};
  state.score = { attempted: 0, correct: 0, wrong: 0 };
  state.wrongIds = [];
  state.quizStarted = true;
  persistState();
  renderQuiz();
  setView('quiz');
}

function renderMistakes() {
  const cards = state.wrongIds
    .map(id => state.questionLookup[id])
    .filter(Boolean)
    .map(q => `
      <div class="list-card">
        <span class="topic-chip">${q.topic}</span>
        <p><strong>${q.question}</strong></p>
        <p class="small">Correct: ${q.correctAnswerText}</p>
        <p class="small">Tip: ${q.mnemonicTip}</p>
      </div>
    `)
    .join('');

  el.mistakes.innerHTML = `
    <div class="card">
      <h2>Mistakes Review</h2>
      <p class="small">Review your wrong answers and memory hooks.</p>
      ${cards || '<p class="small">No mistakes logged yet.</p>'}
      <div class="btn-row"><button class="ghost" id="mistakesHomeBtn">Back Home</button></div>
    </div>
  `;

  document.getElementById('mistakesHomeBtn').onclick = () => {
    renderHome();
    setView('home');
  };
  setView('mistakes');
}

function renderReviewPanel() {
  const correctedRows = state.correctionLogs.map(log => `
    <div class="list-card">
      <strong>${log.id || log.questionId || 'Unknown question'}</strong>
      <span class="topic-chip">${log.includedInFinalQuiz === false ? 'Excluded' : 'Included'}</span>
      <p class="small">Reason: ${log.correctionReason || 'Not recorded'} · Confidence: ${log.confidenceScore ?? 'N/A'}</p>
      <p class="small">Basis: ${log.correctionBasis || 'No basis text provided.'}</p>
    </div>
  `).join('');

  const flaggedRows = state.flaggedQuestions.map(item => `
    <div class="list-card">
      <strong>${item.id || item.questionId || 'Unknown question'}</strong>
      <p class="small">Source: ${item.sourceTextFile || 'N/A'} ${item.sourcePageMarker ? `· ${item.sourcePageMarker}` : ''}</p>
      <p class="small">Reason: ${Array.isArray(item.flagReasons) ? item.flagReasons.join('; ') : (item.flagReason || 'Not recorded')}</p>
      <p class="small">Action: ${item.recommendedAction || 'Manual review required'}</p>
    </div>
  `).join('');

  el.review.innerHTML = `
    <div class="card">
      <h2>Developer Review Panel</h2>
      <p class="small">Transparent view of corrected and flagged items (excluded from live quiz if flagged).</p>
      <h3>Corrections Log</h3>
      ${correctedRows || '<p class="small">No corrections logged.</p>'}
      <h3>Flagged Questions</h3>
      ${flaggedRows || '<p class="small">No flagged items.</p>'}
      <div class="btn-row"><button class="ghost" id="reviewHomeBtn">Back Home</button></div>
    </div>
  `;

  document.getElementById('reviewHomeBtn').onclick = () => {
    renderHome();
    setView('home');
  };
}

function getWeakAreas() {
  const counts = {};
  for (const [id, selected] of Object.entries(state.answered)) {
    const q = state.questionLookup[id];
    if (!q) continue;
    counts[q.topic] ??= { wrong: 0, total: 0 };
    counts[q.topic].total += 1;
    if (selected !== q.correctAnswerIndex) counts[q.topic].wrong += 1;
  }
  return Object.entries(counts)
    .filter(([, data]) => data.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 3)
    .map(([topic, data]) => `${topic} (${data.wrong}/${data.total} wrong)`);
}
