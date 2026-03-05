<script>
  (function () {
    const overlay = document.getElementById("nlOverlay");
    const closeBtn = document.getElementById("nlClose");
    const noThanksBtn = document.getElementById("nlNoThanks");
    const form = document.getElementById("nlForm");
    const emailInput = document.getElementById("nlEmail");
    const msg = document.getElementById("nlMsg");
    const submitBtn = document.getElementById("nlSubmit");

    // LocalStorage flags
    const LS_SUBSCRIBED = "nl_subscribed_v1";
    const LS_DISMISSED_AT = "nl_dismissed_at_v1";

    // 1) Se già iscritto → non mostrare mai
    if (localStorage.getItem(LS_SUBSCRIBED) === "1") return;

    // 2) Se chiuso di recente → non rompere (7 giorni)
    const dismissedAt = Number(localStorage.getItem(LS_DISMISSED_AT) || "0");
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (dismissedAt && Date.now() - dismissedAt < SEVEN_DAYS) return;

    function openPopup() {
      if (!overlay) return;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      setTimeout(() => emailInput && emailInput.focus(), 120);
    }

    function closePopup() {
      if (!overlay) return;
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      localStorage.setItem(LS_DISMISSED_AT, String(Date.now()));
    }

    // 3) Apri dopo 10 secondi
    setTimeout(openPopup, 10000);

    // chiusure
    closeBtn && closeBtn.addEventListener("click", closePopup);
    noThanksBtn && noThanksBtn.addEventListener("click", closePopup);

    overlay &&
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closePopup();
      });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay && overlay.classList.contains("is-open")) {
        closePopup();
      }
    });

    // 4) Submit: chiama la Edge Function Supabase
    form &&
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.textContent = "";

        const email = (emailInput.value || "").trim().toLowerCase();
        if (!email || !email.includes("@")) {
          msg.textContent = "Inserisci una mail valida.";
          return;
        }

        // UI loading
        submitBtn.disabled = true;
        submitBtn.textContent = "INVIO...";

        try {
          // 🔧 CONFIG: prendo Supabase URL/ANON KEY dal tuo config.js
          // Devi avere:
          // window.SUPABASE_URL = "https://xxxx.supabase.co"
          // window.SUPABASE_ANON_KEY = "eyJ..."
          const SUPABASE_URL = window.SUPABASE_URL || window.APP_CONFIG?.SUPABASE_URL;
          const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window.APP_CONFIG?.SUPABASE_ANON_KEY;

          if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error("Manca la config Supabase (SUPABASE_URL / SUPABASE_ANON_KEY).");
          }

          const endpoint = `${SUPABASE_URL}/functions/v1/newsletter-signup`;

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ email }),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data?.error || "Errore durante l’iscrizione. Riprova.");
          }

          // Possibili risposte: sent / already / ok
          const status = data?.status || (data?.ok ? "sent" : "ok");

          if (status === "already") {
            msg.textContent = "Questa email risulta già iscritta. ✅";
          } else {
            msg.textContent = "Perfetto! Ti abbiamo inviato una mail con il codice sconto. ✅";
          }

          // Segna come iscritto localmente
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
