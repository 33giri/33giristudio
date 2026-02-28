// assets/js/reviews.js — Supabase powered (global reviews, no manual edits)

// CDN supabase-js (lo carichiamo da recensioni.html e index.html)
const SUPA = window.__SUPABASE__;
if (!SUPA?.url || !SUPA?.anonKey) {
  console.warn("Supabase config mancante: controlla assets/js/config.js");
}
 
const supabase = window.supabase?.createClient?.(SUPA.url, SUPA.anonKey);

// Config
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_COMMENT_LENGTH = 500;
const STORAGE_BUCKET = "reviews"; // bucket supabase storage

// State
let selectedFiles = [];

/* =========================
   BOOTSTRAP
   ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  // Pagina form recensioni
  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    initFormUI();
    await renderRecentReviews();
  }

  // Homepage (V2 strip)
  const strip = document.querySelector(".reviews-strip");
  // (Fallback vecchio)
  const oldGrid = document.querySelector(".reviews-grid");

  if (strip || oldGrid) {
    await renderHomeReviews();
  }
});

/* =========================
   FORM UI
   ========================= */
function initFormUI() {
  const starInputs = document.querySelectorAll('.star-rating input[type="radio"]');
  const ratingValue = document.getElementById("ratingValue");
  const reviewComment = document.getElementById("reviewComment");
  const charCount = document.getElementById("charCount");
  const reviewImages = document.getElementById("reviewImages");
  const imagePreview = document.getElementById("imagePreview");

  // stelle
  starInputs.forEach((input) => {
    input.addEventListener("change", function () {
      const rating = this.value;
      if (ratingValue) ratingValue.textContent = `${rating} ${rating === "1" ? "stella" : "stelle"} selezionate`;
    });
  });

  // contatore caratteri
  reviewComment?.addEventListener("input", function () {
    const length = this.value.length;
    if (charCount) charCount.textContent = length;

    if (length > MAX_COMMENT_LENGTH) {
      this.value = this.value.substring(0, MAX_COMMENT_LENGTH);
      if (charCount) charCount.textContent = MAX_COMMENT_LENGTH;
    }
  });

  // upload immagini
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
      // preview
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
  const form = document.getElementById("reviewForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitReview();
  });
}

async function submitReview() {
  if (!supabase) return;

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
    // 1) upload immagini (se presenti) → ottieni URL pubblici
    const imageUrls = await uploadImagesToSupabase(selectedFiles);

    // 2) insert review
    const { error } = await supabase
      .from("reviews")
      .insert([{
        name,
        email: email || null,
        rating,
        comment,
        images: imageUrls
      }]);

    if (error) throw error;

    // reset UI
    document.getElementById("reviewForm")?.reset();
    document.getElementById("imagePreview").innerHTML = "";
    selectedFiles = [];
    const ratingValue = document.getElementById("ratingValue");
    const charCount = document.getElementById("charCount");
    if (ratingValue) ratingValue.textContent = "";
    if (charCount) charCount.textContent = "0";

    showFormMessage("Grazie! La tua recensione è stata pubblicata.", "success");

    // refresh lists
    await renderRecentReviews();
    await renderHomeReviews(); // se la pagina contiene la strip

  } catch (err) {
    console.error(err);
    showFormMessage("Errore durante l'invio. Riprova tra poco.", "error");
  } finally {
    if (btnText && btnLoader) {
      btnText.style.display = "inline";
      btnLoader.style.display = "none";
    }
  }
}

/* =========================
   UPLOAD IMMAGINI (Supabase Storage)
   ========================= */
async function uploadImagesToSupabase(files) {
  if (!files?.length) return [];
  if (!supabase) return [];

  const urls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `public/${Date.now()}-${Math.random().toString(16).slice(2)}-${i}.${safeExt}`;

    const { error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false });

    if (error) {
      console.warn("Upload fallito:", error);
      continue; // non blocchiamo tutta la recensione
    }

    const { data } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    if (data?.publicUrl) urls.push(data.publicUrl);
  }

  return urls;
}

/* =========================
   FETCH
   ========================= */
async function fetchAllReviews(limit = 200) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("reviews")
    .select("id,name,rating,comment,images,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

/* =========================
   RENDER: pagina recensioni (recenti)
   ========================= */
async function renderRecentReviews() {
  const list = document.getElementById("recentReviewsList");
  if (!list) return;

  const rows = await fetchAllReviews(12);
  if (!rows.length) {
    list.innerHTML = `<p style="text-align:center; color:#999;">Nessuna recensione ancora. Sii il primo!</p>`;
    return;
  }

  list.innerHTML = rows.map(createReviewCardFull).join("");
}

/* =========================
   RENDER: HOME (V2 strip + accordion)
   - mostra TUTTE le recensioni a prescindere dal rating
   ========================= */
async function renderHomeReviews() {
  const strip = document.querySelector(".reviews-strip");
  const oldGrid = document.querySelector(".reviews-grid");
  if (!strip && !oldGrid) return;

  const rows = await fetchAllReviews(50);

  // V2 strip
  if (strip) {
    if (!rows.length) {
      strip.innerHTML = `<p style="color:#666; padding:8px 6px;">Le recensioni stanno arrivando...</p>`;
      return;
    }

    strip.innerHTML = rows.map(createReviewCardCompact).join("");

    // click delegation (una aperta alla volta)
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
    oldGrid.innerHTML = rows.slice(0, 6).map(createReviewCardFull).join("");
  }
}

/* =========================
   TEMPLATE: FULL card (pagina recensioni)
   ========================= */
function createReviewCardFull(review) {
  const date = new Date(review.created_at);
  const formattedDate = date.toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" });

  const stars = renderStars(review.rating);
  const imagesHTML = (review.images && review.images.length)
    ? `<div class="review-images">
         ${review.images.map((img) => `<img src="${img}" alt="Foto recensione" loading="lazy">`).join("")}
       </div>`
    : "";

  return `
    <div class="review-card">
      <div class="review-header">
        <div class="reviewer-info">
          <h3>${escapeHtml(review.name)}</h3>
          <div class="review-date">${formattedDate}</div>
        </div>
        <div class="review-stars">${stars}</div>
      </div>
      <p class="review-comment">${escapeHtml(review.comment)}</p>
      ${imagesHTML}
    </div>
  `;
}

/* =========================
   TEMPLATE: COMPACT card (home V2)
   ========================= */
function createReviewCardCompact(review) {
  const stars = renderStars(review.rating);

  return `
    <div class="r2-card" data-open="false">
      <button class="r2-btn" type="button" data-review-toggle="1" aria-expanded="false">
        <div>
          <div class="r2-name">${escapeHtml(review.name)}</div>
          <div class="r2-stars">${stars}</div>
        </div>
        <span class="r2-chev">⌄</span>
      </button>

      <div class="r2-body">
        <p class="r2-comment">${escapeHtml(review.comment)}</p>
      </div>
    </div>
  `;
}

function renderStars(rating) {
  const r = Math.max(1, Math.min(5, parseInt(rating, 10) || 1));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function showFormMessage(message, type) {
  const formMessage = document.getElementById("formMessage");
  if (!formMessage) return;

  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
  formMessage.style.display = "block";

  setTimeout(() => {
    formMessage.style.display = "none";
  }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}
