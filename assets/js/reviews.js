// reviews.js - Sistema di gestione recensioni 33Giri

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_COMMENT_LENGTH = 500;

// Recensioni base (ufficiali)
const BASE_REVIEWS = [
  {
    id: 1,
    name: "Corrado Pisoni",
    email: "",
    rating: 5,
    comment:
      "Ottimo svuota-tasche in vinile, ben rifinito e con un design dipinto a mano davvero curato. ogni pezzo è unico e si vede la qualità del lavoro artigianale, molto bello e utile da avere in casa😁",
    images: [],
    date: new Date("2025-11-15").toISOString(),
    verified: true,
  },
  {
    id: 2,
    name: "Federico Missidenti",
    email: "",
    rating: 4.5,
    comment: "Il 33giri è molto comodo e ha un'estetica curata e piacevole",
    images: [],
    date: new Date("2025-11-22").toISOString(),
    verified: true,
  },
  {
    id: 3,
    name: "Claudia Bortolotti",
    email: "",
    rating: 4,
    comment:
      "Bellissimo oggetto di design. Io personalmente lo uso come porta vasi e da eeffetto wow. Consigliatissimo!",
    images: [],
    date: new Date("2025-11-25").toISOString(),
    verified: true,
  },
  {
    id: 4,
    name: "Vittoria Tretter",
    email: "",
    rating: 5,
    comment:
      "Ho comprato da 33giristudio al mercatino dei gaulenti. I ragazzi sono stati disponibili , il progetto è interessante ,creativo ed  estremente contemporaneo . Al prezzo di 20 euro ho ricevuto il disco  personalizzato con la copertina originale  e lo sticker dello studio , il tutto contenuto nella loro scatola personalizzata . Sarà il primo di molti ",
    images: [],
    date: new Date("2025-11-27").toISOString(),
    verified: true,
  },
];

let reviews = [];

/* =========================
   LOAD / SAVE
   ========================= */
function loadReviews() {
  let userReviews = [];
  try {
    const saved = localStorage.getItem("33giri_user_reviews");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) userReviews = parsed;
    }
  } catch (e) {
    console.warn("Errore nel leggere le recensioni utente dal localStorage", e);
  }

  // user prima, poi base
  reviews = [...userReviews, ...BASE_REVIEWS];
  return reviews;
}

function saveUserReviews(userReviews) {
  try {
    localStorage.setItem("33giri_user_reviews", JSON.stringify(userReviews));
  } catch (e) {
    console.warn("Impossibile salvare le recensioni utente", e);
  }
}

/* =========================
   BOOTSTRAP
   ========================= */
document.addEventListener("DOMContentLoaded", function () {
  loadReviews();

  // pagina recensioni
  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    initializeForm();
    displayRecentReviews();
  }

  // homepage: V2 (reviews-strip) o fallback vecchio (reviews-grid)
  const strip = document.querySelector(".reviews-strip");
  const oldGrid = document.querySelector(".reviews-grid");
  if (strip || oldGrid) {
    displayReviewsOnHomepage();
  }
});

/* =========================
   PAGINA RECENSIONI (FORM)
   ========================= */
function initializeForm() {
  const reviewForm = document.getElementById("reviewForm");
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
      if (ratingValue) {
        ratingValue.textContent = `${rating} ${rating === "1" ? "stella" : "stelle"} selezionate`;
      }
    });
  });

  // contatore caratteri
  reviewComment.addEventListener("input", function () {
    const length = this.value.length;
    if (charCount) charCount.textContent = length;

    if (length > MAX_COMMENT_LENGTH) {
      this.value = this.value.substring(0, MAX_COMMENT_LENGTH);
      if (charCount) charCount.textContent = MAX_COMMENT_LENGTH;
    }
  });

  // upload immagini
  let selectedFiles = [];

  reviewImages.addEventListener("change", function (e) {
    const files = Array.from(e.target.files);

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
      displayImagePreview(file);
    });

    e.target.value = "";
  });

  // drag & drop (se presente)
  const fileInputLabel = document.querySelector(".file-input-label");
  if (fileInputLabel) {
    fileInputLabel.addEventListener("dragover", function (e) {
      e.preventDefault();
      this.style.borderColor = "#1a1a1a";
      this.style.background = "#f0f0f0";
    });

    fileInputLabel.addEventListener("dragleave", function (e) {
      e.preventDefault();
      this.style.borderColor = "#ccc";
      this.style.background = "#fafafa";
    });

    fileInputLabel.addEventListener("drop", function (e) {
      e.preventDefault();
      this.style.borderColor = "#ccc";
      this.style.background = "#fafafa";

      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));

      if (selectedFiles.length + files.length > MAX_IMAGES) {
        showFormMessage(`Puoi caricare massimo ${MAX_IMAGES} immagini`, "error");
        return;
      }

      files.forEach((file) => {
        if (file.size > MAX_IMAGE_SIZE) {
          showFormMessage(`L'immagine ${file.name} supera i 5MB`, "error");
          return;
        }
        selectedFiles.push(file);
        displayImagePreview(file);
      });
    });
  }

  function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const previewItem = document.createElement("div");
      previewItem.className = "preview-item";
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="preview-remove" data-filename="${escapeHtml(file.name)}">×</button>
      `;

      imagePreview.appendChild(previewItem);

      previewItem.querySelector(".preview-remove").addEventListener("click", function () {
        const filename = this.getAttribute("data-filename");
        selectedFiles = selectedFiles.filter((f) => f.name !== filename);
        previewItem.remove();
      });
    };
    reader.readAsDataURL(file);
  }

  // submit
  reviewForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const checked = document.querySelector('.star-rating input[type="radio"]:checked');

    const formData = {
      name: document.getElementById("reviewerName").value.trim(),
      email: document.getElementById("reviewerEmail").value.trim(),
      rating: checked ? parseFloat(checked.value) : 0,
      comment: document.getElementById("reviewComment").value.trim(),
      images: [],
      date: new Date().toISOString(),
      verified: false, // resta non verificata
    };

    if (!formData.name) return showFormMessage("Inserisci il tuo nome", "error");
    if (!formData.rating) return showFormMessage("Seleziona una valutazione", "error");
    if (!formData.comment) return showFormMessage("Scrivi un commento", "error");
    if (!document.getElementById("privacyConsent").checked) {
      return showFormMessage("Accetta l'informativa sulla privacy", "error");
    }

    const btnText = document.querySelector(".btn-text");
    const btnLoader = document.querySelector(".btn-loader");
    if (btnText && btnLoader) {
      btnText.style.display = "none";
      btnLoader.style.display = "inline";
    }

    const imagePromises = selectedFiles.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(imagePromises).then((images) => {
      formData.images = images;

      const newReview = {
        id: Date.now(),
        ...formData,
      };

      let userReviews = [];
      try {
        const saved = localStorage.getItem("33giri_user_reviews");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) userReviews = parsed;
        }
      } catch (e) {
        console.warn("Errore nel leggere le recensioni utente dal localStorage", e);
      }

      userReviews.unshift(newReview);
      saveUserReviews(userReviews);

      // aggiorna memoria runtime
      loadReviews();

      // reset UI
      reviewForm.reset();
      imagePreview.innerHTML = "";
      selectedFiles = [];
      if (ratingValue) ratingValue.textContent = "";
      if (charCount) charCount.textContent = "0";

      if (btnText && btnLoader) {
        btnText.style.display = "inline";
        btnLoader.style.display = "none";
      }

      showFormMessage("Grazie per la tua recensione! Sarà pubblicata dopo la verifica.", "success");
      displayRecentReviews();

      // ✅ in home NON apparirà finché non è verified=true (quindi niente “in verifica”)
      displayReviewsOnHomepage();
    });
  });
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

/* =========================
   RECENT (pagina recensioni)
   ========================= */
function displayRecentReviews() {
  const recentReviewsList = document.getElementById("recentReviewsList");
  if (!recentReviewsList) return;

  const recentReviews = reviews.slice(0, 6);

  if (recentReviews.length === 0) {
    recentReviewsList.innerHTML =
      '<p style="text-align:center; color:#999;">Nessuna recensione ancora. Sii il primo a lasciarne una!</p>';
    return;
  }

  recentReviewsList.innerHTML = recentReviews.map((review) => createReviewCardFull(review)).join("");
}

function createReviewCardFull(review) {
  const date = new Date(review.date);
  const formattedDate = date.toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" });

  const ratingNum = typeof review.rating === "number" ? review.rating : parseFloat(review.rating) || 0;
  const safeRating = Math.max(0, Math.min(5, Math.round(ratingNum)));
  const stars = "★".repeat(safeRating) + "☆".repeat(5 - safeRating);

  const imagesHTML =
    review.images && review.images.length > 0
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
   HOMEPAGE — SOLO VERIFICATE
   ========================= */
function displayReviewsOnHomepage() {
  const strip = document.querySelector(".reviews-strip");
  const oldGrid = document.querySelector(".reviews-grid");
  if (!strip && !oldGrid) return;

  if (!Array.isArray(reviews) || reviews.length === 0) loadReviews();

  // ✅ SOLO recensioni verificate (niente “in verifica”)
  const eligible = reviews.filter((r) => {
    const rating = parseFloat(r.rating) || 0;
    return rating >= 4 && r.verified === true;
  });

  const top = eligible.slice(0, 12);

  // V2 strip
  if (strip) {
    if (top.length === 0) {
      strip.innerHTML = '<p style="color:#666; padding:8px 6px;">Le recensioni stanno arrivando...</p>';
      return;
    }

    strip.innerHTML = top.map((r) => createReviewCardCompact(r)).join("");

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

  // fallback vecchio grid
  if (oldGrid) {
    if (top.length === 0) {
      oldGrid.innerHTML =
        '<p style="text-align:center; color:#999; grid-column: 1/-1;">Le recensioni stanno arrivando...</p>';
      return;
    }
    oldGrid.innerHTML = top.slice(0, 6).map((r) => createReviewCardFull(r)).join("");
  }
}

function createReviewCardCompact(review) {
  const ratingNum = typeof review.rating === "number" ? review.rating : parseFloat(review.rating) || 0;
  const safeRating = Math.max(0, Math.min(5, Math.round(ratingNum)));
  const stars = "★".repeat(safeRating) + "☆".repeat(5 - safeRating);

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

/* =========================
   UTIL
   ========================= */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}
