const steps = document.querySelectorAll('.quiz33__step');
const resultBox = document.getElementById('quiz33-result');
const imgEl = document.getElementById('quiz33-img');
const titleEl = document.getElementById('quiz33-title');
const artistEl = document.getElementById('quiz33-artist');
const descEl = document.getElementById('quiz33-desc');
const buyEl = document.getElementById('quiz33-buy');
const msgEl = document.getElementById('quiz33-msg');

const cfg = window.QUIZ33_CONFIG || {};
const selections = [];
let matched = null;

const FALLBACK_MAP = {
  nostalgia: 'Standard',
  energia: 'Splash',
  liberta: 'Spiral',
  tenerezza: 'Disegnato',
  introspezione: 'Disegnato'
};

document.querySelectorAll('.quiz33__btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const stepEl = e.currentTarget.closest('.quiz33__step');
    const theme = e.currentTarget.dataset.theme;
    if (theme) selections.push(theme);
    stepEl.classList.add('is-hidden');
    const next = stepEl.nextElementSibling;
    if (next && next.classList.contains('quiz33__step')) next.classList.remove('is-hidden');
    else finishQuiz();
  });
});

async function finishQuiz() {
  msgEl.textContent = '';
  
  try {
    if (cfg.webhookMatch) {
      const res = await fetch(cfg.webhookMatch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selections })
      });
      const text = await res.text();
      try { matched = JSON.parse(text); }
      catch { matched = null; }
    }
  } catch (err) {
    matched = null;
  }

  if (!matched) msgEl.textContent = 'Webhook non risponde o ha restituito JSON non valido — apri Console/Network';

  function normalize(m) {
    if (!m) return null;
    return {
      pickLabel: m.pickLabel || m.category || m.model || '',
      id: m.id || m.vinyl_id || '',
      title: m.title || m.name || 'Il tuo 33Giri',
      artist: m.artist || m.author || '',
      image: m.image || m.cover || '',
      description: m.description || m.desc || ''
    };
  }
  matched = normalize(matched);

  const tally = { Standard: 0, Splash: 0, Spiral: 0, Disegnato: 0 };
  selections.forEach(t => {
    const cat = FALLBACK_MAP[t] || 'Standard';
    tally[cat] = (tally[cat] || 0) + 1;
  });
  const fallbackPick = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];

  const pickLabel = (matched && matched.pickLabel) || fallbackPick;
  const img = (matched && matched.image) || '';
  const title = (matched && matched.title) || `Il tuo 33Giri: ${pickLabel}`;
  const artist = (matched && matched.artist) || '';
  const desc = (matched && matched.description) || `In base alle tue risposte, ti consigliamo ${pickLabel}.`;

  imgEl.src = img;
  imgEl.alt = title;
  titleEl.textContent = title;
  artistEl.textContent = artist;
  descEl.textContent = desc;
  resultBox.classList.remove('is-hidden');

  updateBuyHref();

  try {
    if (cfg.webhookReserve && matched && matched.id) {
      await fetch(cfg.webhookReserve, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vinyl_id: matched.id, vinyl_title: matched.title })
      });
    }
  } catch (err) {
    console.warn('Webhook RESERVE errore', err);
  }
}

function updateBuyHref() {
  const perso = document.querySelector('input[name="quiz33-perso"]:checked')?.value || 'Standard';
  const href = (cfg.links && cfg.links[perso]) ? cfg.links[perso] : '#catalogo';
  buyEl.setAttribute('href', href);
}

document.querySelectorAll('input[name="quiz33-perso"]').forEach(r => r.addEventListener('change', updateBuyHref));