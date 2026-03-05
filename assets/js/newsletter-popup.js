<script>
(function () {
  const overlay   = document.getElementById("nl0verlay");
  const closeBtn  = document.getElementById("nlClose");
  const noThanks  = document.getElementById("nlNoThanks");
  const form      = document.getElementById("nlForm");
  const emailIn   = document.getElementById("nlEmail");
  const msg       = document.getElementById("nlMsg");
  const submitBtn = document.getElementById("nlSubmit");

  const LS_SUBSCRIBED   = "nl_subscribed_v1";
  const LS_DISMISSED_AT = "nl_dismissed_at_v1";

  // Se già iscritto → non mostrare
  if (localStorage.getItem(LS_SUBSCRIBED) === "1") return;

  // Se chiuso di recente → non mostrare per 7 giorni
  const dismissedAt = Number(localStorage.getItem(LS_DISMISSED_AT) || "0");
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  if (dismissedAt && (Date.now() - dismissedAt) < SEVEN_DAYS) return;

  function openPopup() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    setTimeout(() => emailIn && emailIn.focus(), 120);
  }

  function closePopup() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    localStorage.setItem(LS_DISMISSED_AT, String(Date.now()));
  }

  // Mostra dopo 10 secondi
  setTimeout(openPopup, 10000);

  // Chiudi
  closeBtn && closeBtn.addEventListener("click", closePopup);
  noThanks && noThanks.addEventListener("click", closePopup);

  overlay && overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay && overlay.classList.contains("is-open")) {
      closePopup();
    }
  });

  // Submit
  form && form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const email = (emailIn.value || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      msg.textContent = "Inserisci una mail valida.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "INVIO...";

    try {
      // ✅ Usa il client creato dal tuo config.js
      const sb = window.__SB_CLIENT__;
      if (!sb || !sb.functions?.invoke) {
        throw new Error("Supabase non pronto: controlla che SDK e config.js siano caricati prima di questo script.");
      }

      // Chiama Edge Function "newsletter-signup"
      const { data, error } = await sb.functions.invoke("newsletter-signup", {
        body: { email }
      });

      if (error) {
        // error può contenere message utile
        throw new Error(error.message || "Errore durante l’iscrizione.");
      }

      const status = data?.status || (data?.ok ? "sent" : "ok");

      if (status === "already") {
        msg.textContent = "Questa email risulta già iscritta. ✅";
      } else if (status === "sent") {
        msg.textContent = "Perfetto! Ti abbiamo inviato una mail con il codice sconto. ✅";
      } else {
        msg.textContent = "Ok! Controlla la mail (anche spam). ✅";
      }

      // Segna come iscritto → non mostrare più popup
      localStorage.setItem(LS_SUBSCRIBED, "1");
      submitBtn.textContent = "INVIATO ✓";

      setTimeout(closePopup, 1200);

    } catch (err) {
      console.error(err);
      msg.textContent = err?.message || "Errore durante l’iscrizione. Riprova tra poco.";
      submitBtn.disabled = false;
      submitBtn.textContent = "OTTIENI LO SCONTO DEL 10%";
    }
  });
})();
</script>
