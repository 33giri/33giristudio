(function(){
  const overlay = document.getElementById('nl-overlay');
  const closeBtn = document.getElementById('nl-close');
  const form = document.getElementById('nl-form');
  const emailInput = document.getElementById('nl-email');
  const msg = document.getElementById('nl-msg');
  const submitBtn = document.getElementById('nl-submit');

  // Se già iscritto in passato, non mostrare
  const FLAG = 'nl_subscribed_v1';
  if (localStorage.getItem(FLAG) === '1') return;

  // Apri dopo 10s
  setTimeout(() => {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    setTimeout(() => emailInput?.focus(), 150);
  }, 10000);

  function close(){
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
  }

  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const email = (emailInput.value || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      msg.textContent = 'Inserisci una mail valida.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio...';

    try {
      // Chiama Edge Function Supabase (vedi punto 5)
      // Metti questi valori in assets/js/config.js (o dove tieni config supabase)
      const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL;
      const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Config Supabase mancante (URL / ANON KEY).');
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json().catch(()=> ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Errore durante l’iscrizione.');
      }

      localStorage.setItem(FLAG, '1');
      msg.textContent = 'Perfetto! Ti abbiamo inviato una mail con il codice sconto.';
      submitBtn.textContent = 'Inviato ✓';

      setTimeout(close, 1400);

    } catch (err) {
      msg.textContent = err.message || 'Errore. Riprova.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ricevi il codice';
    }
  });
})();
