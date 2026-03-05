(function () {
  // ====== DOM ======
  const overlay   = document.getElementById("nlOverlay");
  const closeBtn  = document.getElementById("nlClose");
  const noThanks  = document.getElementById("nlNoThanks");
  const form      = document.getElementById("nlForm");
  const emailIn   = document.getElementById("nlEmail");
  const msg       = document.getElementById("nlMsg");
  const submitBtn = document.getElementById("nlSubmit");

  // Se il popup non esiste nella pagina → esci
  if (!overlay) return;

  // ====== STORAGE ======
  const LS_SUBSCRIBED   = "nl_subscribed_v1";
  const LS_DISMISSED_AT = "nl_dismissed_at_v1";

  // Se già iscritto (su questo browser) → non mostrare
  if (localStorage.getItem(LS_SUBSCRIBED) === "1") return;

  // Se chiuso di recente → non mostrare per 7 giorni
  const dismissedAt = Number(localStorage.getItem(LS_DISMISSED_AT) || "0");
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  if (dismissedAt && (Date.now() - dismissedAt) < SEVEN_DAYS) return;

  // ====== UI ======
  function openPopup() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    setTimeout(() => emailIn && emailIn.focus(), 120);
  }

  function closePopup() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    localStorage.setItem(LS_DISMISSED_AT, String(Date.now()));
  }

  // Mostra dopo 10 secondi
  setTimeout(openPopup, 10000);

  // Chiudi (X / No grazie)
  closeBtn && closeBtn.addEventListener("click", closePopup);
  noThanks && noThanks.addEventListener("click", closePopup);

  // Chiudi cliccando fuori dal modal
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });

  // Chiudi con ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) closePopup();
  });

  // ====== SUBMIT ======
  form && form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";

    const email = (emailIn?.value || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      if (msg) msg.textContent = "Inserisci una mail valida.";
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "INVIO...";
    }

    try {
      // ✅ PRENDO URL + ANON KEY DAL TUO config.js
      // window.__SUPABASE__ = { url, anonKey }
      const url = window.__SUPABASE__?.url;
      const anonKey = window.__SUPABASE__?.anonKey;

      if (!url || !anonKey) {
        throw new Error("Config Supabase mancante (window.__SUPABASE__).");
      }

      // ✅ CHIAMATA EDGE FUNCTION (fetch manuale) -> evita 401 su invoke
      const res = await fetch(`${url}/functions/v1/newsletter-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey}`,
          "apikey": anonKey,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Supabase a volte risponde con {message: "..."} oppure {error:"..."}
        throw new Error(data?.message || data?.error || "Errore durante l’iscrizione.");
      }

      const status = data?.status || (data?.ok ? "sent" : "ok");

      if (msg) {
        if (status === "already") {
          msg.textContent = "Questa email risulta già iscritta. ✅";
        } else if (status === "sent") {
          msg.textContent = "Perfetto! Ti abbiamo inviato una mail con il codice sconto. ✅";
        } else {
          msg.textContent = "Ok! Controlla la mail (anche spam). ✅";
        }
      }

      // ✅ segna iscritto su questo browser -> non riapparirà più
      localStorage.setItem(LS_SUBSCRIBED, "1");

      if (submitBtn) submitBtn.textContent = "INVIATO ✓";
      setTimeout(closePopup, 1200);

    } catch (err) {
      console.error(err);
      if (msg) msg.textContent = err?.message || "Errore durante l’iscrizione. Riprova tra poco.";
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "OTTIENI LO SCONTO DEL 10%";
      }
    }
  });
})();
