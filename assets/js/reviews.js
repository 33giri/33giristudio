/* assets/js/reviews.js — SAFE version (no double-declare, no double-init) */
(() => {
  // evita inizializzazione doppia
  if (window.__REVIEWS_SYSTEM_INIT__) return;
  window.__REVIEWS_SYSTEM_INIT__ = true;

  // ===== Helpers =====
  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
  };

  const renderStars = (rating) => {
    const r = Math.max(1, Math.min(5, parseInt(rating, 10) || 1));
    return "★".repeat(r) + "☆".repeat(5 - r);
  };

  const showFormMessage = (message, type) => {
    const el = document.getElementById("formMessage");
    if (!el) {
      alert(message);
      return;
    }
    el.textContent = message;
    el.className = `form-message ${type}`;
    el.style.display = "block";
    setTimeout(() => (el.style.display = "none"), 6000);
  };

  // ===== Config =====
  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const MAX_COMMENT_LENGTH = 500;
  const STORAGE_BUCKET = "reviews";

  let selectedFiles = [];

  // ===== Supabase client singleton =====
  const getClient = () => {
    // già creato
    if (window.__SB_CLIENT__) return { client: window.__SB_CLIENT__, error: null };

    const SUPA = window.__SUPABASE__;
    if (!SUPA?.url || !SUPA?.anonKey) {
      return { client: null, error: "Config Supabase mancante: controlla assets/js/config.js (url + anonKey)." };
    }
    if (!window.supabase?.createClient) {
      return { client: null, error: "Libreria Supabase non caricata: manca lo script @supabase/supabase-js." };
    }

    try {
      window.__SB_CLIENT__ = window.supabase.createClient(SUPA.url, SUPA.anonKey);
      return { client: window.__SB_CLIENT__, error: null };
    } catch (e) {
      return { client: null, error: "Errore inizializzazione Supabase (createClient)." };
    }
  };

  // ===== Data fetch =====
  const fetchAllReviews = async (limit = 200) => {
    const { client, error } = getClient();
    if (!client) {
      console.warn(error);
      return [];
    }

    const { data, error: err } = await client
      .from("reviews")
      .select("id,name,rating,comment,images,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (err) {
      console.error(err);
      return [];
    }
    return data || [];
  };

  // ===== Upload images =====
  const uploadImages = async (files) => {
    if (!files?.length) return [];

    const { client, error } = getClient();
    if (!client) {
      console.warn(error);
      return [];
    }

    const urls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `public/${Date.now()}-${Math.random().toString(16).slice(2)}-${i}.${safeExt}`;

      const { error: upErr } = await client.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
      if (upErr) {
        console.warn("Upload fallito:", upErr);
        continue;
      }

      const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      if (data?.publicUrl) urls.push(data.publicUrl);
    }

    return urls;
  };

  // ===== Render: Home compact =====
  const createCompactCard = (r) => `
    <div class="r2-card" data-open="false">
      <button class="r2-btn" type="button" data-review-toggle="1" aria-expanded="false">
        <div>
          <div class="r2-name">${escapeHtml(r.name)}</div>
          <div class="r2-stars">${renderStars(r.rating)}</div>
        </div>
        <span class="r2-chev">⌄</span>
      </button>
      <div class="r2-body">
        <p class="r2-comment">${escapeHtml(r.comment)}</p>
      </div>
    </div>
  `;

  const renderHome = async () => {
    const strip = document.querySelector(".reviews-strip");
    const oldGrid = document.querySelector(".reviews-grid");
    if (!strip && !oldGrid) return;

    const rows = await fetchAllReviews(50);

    if (strip) {
      strip.innerHTML = rows.length
        ? rows.map(createCompactCard).join("")
        : `<p style="color:#666; padding:8px 6px;">Le recensioni stanno arrivando...</p>`;

      // accordion: una aperta alla volta
      if (!strip.__boundClick) {
        strip.addEventListener("click", (e) => {
          const btn = e.target.closest('[data-review-toggle="1"]');
          if (!btn) return;

          const card = btn.closest(".r2-card");
          if (!card) return;

          const isOpen = card.getAttribute("data-open") === "true";

          strip.querySelectorAll('.r2-card[data-open="true"]').forEach((c) => {
            c.setAttribute("data-open", "false");
            const b = c.querySelector(".r2-btn");
            if (b) b.setAttribute("aria-expanded", "false");
          });

          card.setAttribute("data-open", (!isOpen).toString());
          btn.setAttribute("aria-expanded", (!isOpen).toString());
        });
        strip.__boundClick = true;
      }
      return;
    }

    // fallback vecchio
    if (oldGrid) {
      oldGrid.innerHTML = rows.slice(0, 6).map((r) => `
        <div class="review-card">
          <div class="review-header">
            <div class="reviewer-info"><h3>${escapeHtml(r.name)}</h3></div>
            <div class="review-stars">${renderStars(r.rating)}</div>
          </div>
          <p class="review-comment">${escapeHtml(r.comment)}</p>
        </div>
      `).join("");
    }
  };

  // ===== Render: pagina recensioni (recenti) =====
  const createFullCard = (r) => {
    const date = new Date(r.created_at);
    const formattedDate = date.toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" });

    const imagesHTML = (r.images && r.images.length)
      ? `<div class="review-images">
           ${r.images.map((img) => `<img src="${img}" alt="Foto recensione" loading="lazy">`).join("")}
         </div>`
      : "";

    return `
      <div class="review-card">
        <div class="review-header">
          <div class="reviewer-info">
            <h3>${escapeHtml(r.name)}</h3>
            <div class="review-date">${formattedDate}</div>
          </div>
          <div class="review-stars">${renderStars(r.rating)}</div>
        </div>
        <p class="review-comment">${escapeHtml(r.comment)}</p>
        ${imagesHTML}
      </div>
    `;
  };

  const renderRecent = async () => {
    const list = document.getElementById("recentReviewsList");
    if (!list) return;

    const rows = await fetchAllReviews(12);
    list.innerHTML = rows.length
      ? rows.map(createFullCard).join("")
      : `<p style="text-align:center; color:#999;">Nessuna recensione ancora. Sii il primo!</p>`;
  };

  // ===== Form wiring =====
  const initForm = () => {
    const form = document.getElementById("reviewForm");
    if (!form) return;

    const reviewComment = document.getElementById("reviewComment");
    const charCount = document.getElementById("charCount");
    const ratingValue = document.getElementById("ratingValue");
    const starInputs = document.querySelectorAll('.star-rating input[type="radio"]');

    const reviewImages = document.getElementById("reviewImages");
    const imagePreview = document.getElementById("imagePreview");

    // stelle
    starInputs.forEach((input) => {
      input.addEventListener("change", function () {
        if (ratingValue) ratingValue.textContent = `${this.value} ${this.value === "1" ? "stella" : "stelle"} selezionate`;
      });
    });

    // contatore
    reviewComment?.addEventListener("input", function () {
      const length = this.value.length;
      if (charCount) charCount.textContent = length;
      if (length > MAX_COMMENT_LENGTH) {
        this.value = this.value.substring(0, MAX_COMMENT_LENGTH);
        if (charCount) charCount.textContent = MAX_COMMENT_LENGTH;
      }
    });

    // upload
    reviewImages?.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);

      if (selectedFiles.length + files.length > MAX_IMAGES) {
        showFormMessage(`Puoi caricare massimo ${MAX_IMAGES} immagini`, "error");
        return;
      }

      files.forEach((file) => {
        if (file.size > MAX_IMAGE_SIZE) {
          showFormMessage(`L'immagine ${file.name} supera i 5MB`, "error");
          return;
        }
        if (!file.type.startsWith("image/")) {
          showFormMessage(`${file.name} non è un'immagine valida`, "error");
          return;
        }

        selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = (ev) => {
          const previewItem = document.createElement("div");
          previewItem.className = "preview-item";
          previewItem.innerHTML = `
            <img src="${ev.target.result}" alt="Preview">
            <button type="button" class="preview-remove">×</button>
          `;
          imagePreview.appendChild(previewItem);

          previewItem.querySelector(".preview-remove").addEventListener("click", () => {
            selectedFiles = selectedFiles.filter((f) => f !== file);
            previewItem.remove();
          });
        };
        reader.readAsDataURL(file);
      });

      e.target.value = "";
    });

    // submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); // ✅ evita querystring
      const { client, error } = getClient();
      if (!client) return showFormMessage(error, "error");

      const name = document.getElementById("reviewerName")?.value.trim();
      const email = document.getElementById("reviewerEmail")?.value.trim();
      const checked = document.querySelector('.star-rating input[type="radio"]:checked');
      const rating = checked ? parseInt(checked.value, 10) : 0;
      const comment = document.getElementById("reviewComment")?.value.trim();
      const privacyOk = document.getElementById("privacyConsent")?.checked;

      if (!name) return showFormMessage("Inserisci il tuo nome", "error");
      if (!rating) return showFormMessage("Seleziona una valutazione", "error");
      if (!comment) return showFormMessage("Scrivi un commento", "error");
      if (!privacyOk) return showFormMessage("Accetta l'informativa sulla privacy", "error");

      // loading
      const btnText = document.querySelector(".btn-text");
      const btnLoader = document.querySelector(".btn-loader");
      if (btnText && btnLoader) {
        btnText.style.display = "none";
        btnLoader.style.display = "inline";
      }

      try {
        const imageUrls = await uploadImages(selectedFiles);

        const { error: insErr } = await client.from("reviews").insert([{
          name,
          email: email || null,
          rating,
          comment,
          images: imageUrls
        }]);

        if (insErr) throw insErr;

        // reset
        form.reset();
        if (imagePreview) imagePreview.innerHTML = "";
        selectedFiles = [];
        if (ratingValue) ratingValue.textContent = "";
        if (charCount) charCount.textContent = "0";

        showFormMessage("Grazie! La tua recensione è stata pubblicata.", "success");

        await renderRecent();
        await renderHome();

      } catch (err) {
        console.error(err);
        showFormMessage("Errore invio recensione. Controlla tabella/policy Supabase e riprova.", "error");
      } finally {
        const btnText2 = document.querySelector(".btn-text");
        const btnLoader2 = document.querySelector(".btn-loader");
        if (btnText2 && btnLoader2) {
          btnText2.style.display = "inline";
          btnLoader2.style.display = "none";
        }
      }
    });
  };

  // ===== Boot =====
  document.addEventListener("DOMContentLoaded", async () => {
    initForm();
    await renderRecent();
    await renderHome();
  });
})();
