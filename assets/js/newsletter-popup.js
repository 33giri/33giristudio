(function () {
  // ====== ELEMENTI DOM ======
  const overlay   = document.getElementById("nlOverlay");
  const closeBtn  = document.getElementById("nlClose");
  const noThanks  = document.getElementById("nlNoThanks");
  const form      = document.getElementById("nlForm");
  const emailIn   = document.getElementById("nlEmail");
  const msg       = document.getElementById("nlMsg");
  const submitBtn = document.getElementById("nlSubmit");

  // Se il markup non esiste, esci senza errori
  if (!overlay) return;

  // ====== STORAGE ======
  const LS_SUBSCRIBED   = "nl_subscribed_v1";
  const LS_DISMISSED_AT = "nl_dismissed_at_v1";

  // Se già iscritto localmente → non mostrare
  if (localStorage.getItem(LS_SUBSCRIBED) === "1") return;

  // Se chiuso di recente → non mostrare per 7 giorni
  const dismissedAt = Number(localStorage.getItem(LS_DISMISSED_AT) || "0");
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  if (dismissedAt && (Date.now() - dismissedAt) < SEVEN_DAYS) return;

  // ====== FUNZIONI UI ======
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

  // ====== APERTURA DOPO 10 SECONDI ======
  setTimeout(openPopup, 10000);

  // ====== CHIUSURE ======
  closeBtn && closeBtn.addEventListener("click", closePopup);
  noThanks && noThanks.addEventListener("click", closePopup);

  // click sullo sfondo (overlay)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });

  // ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      closePopup();
    }
  });

  // ====== SUBMIT (SUPABASE EDGE FUNCTION) ======
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
      const sb = window.__SB_CLIENT__;
      if (!sb || !sb.functions?.invoke) {
        throw new Error("Supabase non pronto: controlla @supabase/supabase-js e config.js.");
      }

      // Chiama Edge Function "newsletter-signup"
      const { data, error } = await sb.functions.invoke("newsletter-signup", {
        body: { email }
      });

      if (error) throw new Error(error.message || "Errore durante l’iscrizione.");

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

      // segna come iscritto localmente (così non riappare)
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
