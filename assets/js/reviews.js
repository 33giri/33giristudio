/* assets/js/reviews.js — uses global window.__SB_CLIENT__ */
(() => {
  if (window.__REVIEWS_SYSTEM_INIT__) return;
  window.__REVIEWS_SYSTEM_INIT__ = true;

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
    if (!el) return alert(message);
    el.textContent = message;
    el.className = `rec-msg ${type}`;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, 6000);
  };

  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const MAX_COMMENT_LENGTH = 500;
  const STORAGE_BUCKET = "reviews";

  let selectedFiles = [];

  const getClient = () => {
    const client = window.__SB_CLIENT__;
    if (!client) {
      return {
        client: null,
        error:
          "Supabase client non inizializzato. Controlla ordine script: supabase-js → config.js → createClient → reviews.js",
      };
    }
    return { client, error: null };
  };

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
      console.error("Errore fetch recensioni:", err);
      return [];
    }

    return data || [];
  };

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
      const path = `public/${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}-${i}.${safeExt}`;

      const { error: upErr } = await client.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: false });

      if (upErr) {
        console.warn("Upload immagine fallito:", upErr);
        continue;
      }

      const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      if (data?.publicUrl) urls.push(data.publicUrl);
    }

    return urls;
  };

  const createCompactCard = (r) => {
    const date = new Date(r.created_at);
    const formattedDate = date.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
      <article class="rec-card">
        <div class="rec-card-top">
          <div>
            <div class="rec-card-name">${escapeHtml(r.name || "Anonimo")}</div>
            <div class="rec-card-date">${formattedDate}</div>
          </div>
          <div class="rec-card-stars">${renderStars(r.rating)}</div>
        </div>
        <div class="rec-card-text">${escapeHtml(r.comment || "")}</div>
      </article>
    `;
  };

  const createFullCard = (r) => {
    const date = new Date(r.created_at);
    const formattedDate = date.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const imagesHTML =
      r.images && r.images.length
        ? `
          <div class="review-images">
            ${r.images
              .map(
                (img) =>
                  `<img src="${img}" alt="Foto recensione" loading="lazy">`
              )
              .join("")}
          </div>
        `
        : "";

    return `
      <article class="review-card">
        <div class="review-header">
          <div class="reviewer-info">
            <h3>${escapeHtml(r.name || "Anonimo")}</h3>
            <div class="review-date">${formattedDate}</div>
          </div>
          <div class="review-stars">${renderStars(r.rating)}</div>
        </div>
        <p class="review-comment">${escapeHtml(r.comment || "")}</p>
        ${imagesHTML}
      </article>
    `;
  };

  const renderHome = async () => {
    const strip = document.querySelector(".reviews-strip");
    if (!strip) return;

    const rows = await fetchAllReviews(20);

    strip.innerHTML = rows.length
      ? rows.map(createCompactCard).join("")
      : `
        <div class="rec-card">
          <div class="rec-card-top">
            <div>
              <div class="rec-card-name">Le recensioni arrivano…</div>
              <div class="rec-card-date">nessuna recensione ancora</div>
            </div>
            <div class="rec-card-stars">★★★★★</div>
          </div>
          <div class="rec-card-text">Sii il primo a lasciare una recensione qui sotto.</div>
        </div>
      `;
  };

  const renderRecent = async () => {
    const list = document.getElementById("recentReviewsList");
    if (!list) return;

    const rows = await fetchAllReviews(12);

    list.innerHTML = rows.length
      ? rows.map(createFullCard).join("")
      : `<p style="text-align:center;color:#999;">Nessuna recensione ancora. Sii il primo!</p>`;
  };

  const initForm = () => {
    const form = document.getElementById("reviewForm");
    if (!form) return;

    const reviewComment = document.getElementById("reviewComment");
    const charCount = document.getElementById("charCount");
    const ratingValue = document.getElementById("ratingValue");
    const starInputs = document.querySelectorAll(
      '.star-rating input[type="radio"]'
    );
    const reviewImages = document.getElementById("reviewImages");
    const imagePreview = document.getElementById("imagePreview");
    const btnText = document.querySelector(".btn-text");
    const btnLoader = document.querySelector(".btn-loader");

    starInputs.forEach((input) => {
      input.addEventListener("change", function () {
        if (ratingValue) {
          ratingValue.textContent = `${this.value} ${
            this.value === "1" ? "stella" : "stelle"
          } selezionate`;
        }
      });
    });

    reviewComment?.addEventListener("input", function () {
      const length = this.value.length;
      if (charCount) charCount.textContent = length;

      if (length > MAX_COMMENT_LENGTH) {
        this.value = this.value.substring(0, MAX_COMMENT_LENGTH);
        if (charCount) charCount.textContent = MAX_COMMENT_LENGTH;
      }
    });

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
            <button type="button" class="preview-remove" aria-label="Rimuovi immagine">×</button>
          `;
          imagePreview.appendChild(previewItem);

          previewItem
            .querySelector(".preview-remove")
            .addEventListener("click", () => {
              selectedFiles = selectedFiles.filter((f) => f !== file);
              previewItem.remove();
            });
        };
        reader.readAsDataURL(file);
      });

      e.target.value = "";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const { client, error } = getClient();
      if (!client) return showFormMessage(error, "error");

      const name = document.getElementById("reviewerName")?.value.trim();
      const email = document.getElementById("reviewerEmail")?.value.trim();
      const checked = document.querySelector(
        '.star-rating input[type="radio"]:checked'
      );
      const rating = checked ? parseInt(checked.value, 10) : 0;
      const comment = document.getElementById("reviewComment")?.value.trim();
      const privacyOk = document.getElementById("privacyConsent")?.checked;

      if (!name) return showFormMessage("Inserisci il tuo nome", "error");
      if (!rating) return showFormMessage("Seleziona una valutazione", "error");
      if (!comment) return showFormMessage("Scrivi un commento", "error");
      if (!privacyOk) {
        return showFormMessage(
          "Accetta l'informativa sulla privacy",
          "error"
        );
      }

      if (btnText && btnLoader) {
        btnText.style.display = "none";
        btnLoader.style.display = "inline";
      }

      try {
        const imageUrls = await uploadImages(selectedFiles);

        const { error: insErr } = await client.from("reviews").insert([
          {
            name,
            email: email || null,
            rating,
            comment,
            images: imageUrls,
          },
        ]);

        if (insErr) throw insErr;

        form.reset();
        if (imagePreview) imagePreview.innerHTML = "";
        selectedFiles = [];
        if (ratingValue) ratingValue.textContent = "";
        if (charCount) charCount.textContent = "0";

        showFormMessage(
          "Grazie! La tua recensione è stata pubblicata.",
          "success"
        );

        await renderRecent();
        await renderHome();
      } catch (err) {
        console.error("Errore invio recensione:", err);
        showFormMessage(
          "Errore invio recensione. Controlla tabella, policy RLS e bucket Supabase.",
          "error"
        );
      } finally {
        if (btnText && btnLoader) {
          btnText.style.display = "inline";
          btnLoader.style.display = "none";
        }
      }
    });
  };

  document.addEventListener("DOMContentLoaded", async () => {
    initForm();
    await renderRecent();
    await renderHome();
  });
})();
