// reviews.js - Sistema di gestione recensioni 33Giri

// Configurazione
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_COMMENT_LENGTH = 500;

// Dati recensioni (in produzione questi andrebbero salvati su un database)
let reviews = [];

// Carica recensioni dal localStorage
function loadReviews() {
  const savedReviews = localStorage.getItem('33giri_reviews');
  if (savedReviews) {
    reviews = JSON.parse(savedReviews);
  } else {
    // Recensioni di esempio iniziali
    reviews = [
      {
        id: 1,
        name: "Corrado Pisoni",
        email: "",
        rating: 5,
        comment: "Ottimo svuota-tasche in vinile, ben rifinito e con un design dipinto a mano davvero curato. ogni pezzo è unico e si vede la qualità del lavoro artigianale, molto bello e utile da avere in casa😁",
        images: [],
        date: new Date('2025-11-15').toISOString(),
        verified: true
      },
      {
        id: 2,
        name: "Federico Missidenti",
        email: "",
        rating: 4.5,
        comment: "Il 33giri è molto comodo e ha un'estetica curata e piacevole",
        images: [],
        date: new Date('2025-11-22').toISOString(),
        verified: true
      },
      {
        id: 3,
        name: "Claudia Bortolotti",
        email: "",
        rating: 4,
        comment: "Bellissimo oggetto di design. Io personalmente lo uso come porta vasi e da eeffetto wow. Consigliatissimo!",
        images: [],
        date: new Date('2025-11-25').toISOString(),
        verified: true
      }
    ];
    saveReviews();
  }
  return reviews;
}

// Salva recensioni nel localStorage
function saveReviews() {
  localStorage.setItem('33giri_reviews', JSON.stringify(reviews));
}

// Inizializzazione pagina recensioni
document.addEventListener('DOMContentLoaded', function() {
  const reviewForm = document.getElementById('reviewForm');
  if (!reviewForm) return; // Non siamo nella pagina recensioni
  
  loadReviews();
  initializeForm();
  displayRecentReviews();
});

// Inizializza il form
function initializeForm() {
  const reviewForm = document.getElementById('reviewForm');
  const starInputs = document.querySelectorAll('.star-rating input[type="radio"]');
  const ratingValue = document.getElementById('ratingValue');
  const reviewComment = document.getElementById('reviewComment');
  const charCount = document.getElementById('charCount');
  const reviewImages = document.getElementById('reviewImages');
  const imagePreview = document.getElementById('imagePreview');
  
  // Gestione stelle
  starInputs.forEach(input => {
    input.addEventListener('change', function() {
      const rating = this.value;
      ratingValue.textContent = `${rating} ${rating === '1' ? 'stella' : 'stelle'} selezionate`;
    });
  });
  
  // Contatore caratteri
  reviewComment.addEventListener('input', function() {
    const length = this.value.length;
    charCount.textContent = length;
    
    if (length > MAX_COMMENT_LENGTH) {
      this.value = this.value.substring(0, MAX_COMMENT_LENGTH);
      charCount.textContent = MAX_COMMENT_LENGTH;
    }
  });
  
  // Gestione upload immagini
  let selectedFiles = [];
  
  reviewImages.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    // Verifica numero massimo di immagini
    if (selectedFiles.length + files.length > MAX_IMAGES) {
      showFormMessage(`Puoi caricare massimo ${MAX_IMAGES} immagini`, 'error');
      return;
    }
    
    files.forEach(file => {
      // Verifica dimensione file
      if (file.size > MAX_IMAGE_SIZE) {
        showFormMessage(`L'immagine ${file.name} supera i 5MB`, 'error');
        return;
      }
      
      // Verifica tipo file
      if (!file.type.startsWith('image/')) {
        showFormMessage(`${file.name} non è un'immagine valida`, 'error');
        return;
      }
      
      selectedFiles.push(file);
      displayImagePreview(file);
    });
    
    // Reset input
    e.target.value = '';
  });
  
  // Drag & drop
  const fileInputLabel = document.querySelector('.file-input-label');
  
  fileInputLabel.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = '#1a1a1a';
    this.style.background = '#f0f0f0';
  });
  
  fileInputLabel.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.style.borderColor = '#ccc';
    this.style.background = '#fafafa';
  });
  
  fileInputLabel.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = '#ccc';
    this.style.background = '#fafafa';
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (selectedFiles.length + files.length > MAX_IMAGES) {
      showFormMessage(`Puoi caricare massimo ${MAX_IMAGES} immagini`, 'error');
      return;
    }
    
    files.forEach(file => {
      if (file.size <= MAX_IMAGE_SIZE) {
        selectedFiles.push(file);
        displayImagePreview(file);
      }
    });
  });
  
  // Mostra anteprima immagine
  function displayImagePreview(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="preview-remove" data-filename="${file.name}">×</button>
      `;
      
      imagePreview.appendChild(previewItem);
      
      // Gestione rimozione
      previewItem.querySelector('.preview-remove').addEventListener('click', function() {
        const filename = this.getAttribute('data-filename');
        selectedFiles = selectedFiles.filter(f => f.name !== filename);
        previewItem.remove();
      });
    };
    
    reader.readAsDataURL(file);
  }
  
  // Submit form
  reviewForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('reviewerName').value.trim(),
      email: document.getElementById('reviewerEmail').value.trim(),
      rating: parseInt(document.querySelector('.star-rating input[type="radio"]:checked').value),
      comment: document.getElementById('reviewComment').value.trim(),
      images: [],
      date: new Date().toISOString(),
      verified: false
    };
    
    // Validazione
    if (!formData.name) {
      showFormMessage('Inserisci il tuo nome', 'error');
      return;
    }
    
    if (!formData.rating) {
      showFormMessage('Seleziona una valutazione', 'error');
      return;
    }
    
    if (!formData.comment) {
      showFormMessage('Scrivi un commento', 'error');
      return;
    }
    
    if (!document.getElementById('privacyConsent').checked) {
      showFormMessage('Accetta l\'informativa sulla privacy', 'error');
      return;
    }
    
    // Mostra loading
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    
    // Simula upload immagini (in produzione caricare su server)
    const imagePromises = selectedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          resolve(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(imagePromises).then(images => {
      formData.images = images;
      
      // Salva recensione
      const newReview = {
        id: Date.now(),
        ...formData
      };
      
      reviews.unshift(newReview);
      saveReviews();
      
      // Reset form
      reviewForm.reset();
      imagePreview.innerHTML = '';
      selectedFiles = [];
      ratingValue.textContent = '';
      charCount.textContent = '0';
      
      // Nascondi loading
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      
      // Mostra messaggio successo
      showFormMessage('Grazie per la tua recensione! Sarà pubblicata dopo la verifica.', 'success');
      
      // Ricarica recensioni recenti
      displayRecentReviews();
      
      // Scroll al messaggio
      document.getElementById('formMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

// Mostra messaggio form
function showFormMessage(message, type) {
  const formMessage = document.getElementById('formMessage');
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
  formMessage.style.display = 'block';
  
  setTimeout(() => {
    formMessage.style.display = 'none';
  }, 5000);
}

// Mostra recensioni recenti
function displayRecentReviews() {
  const recentReviewsList = document.getElementById('recentReviewsList');
  if (!recentReviewsList) return;
  
  const recentReviews = reviews.slice(0, 6); // Mostra ultime 6 recensioni
  
  if (recentReviews.length === 0) {
    recentReviewsList.innerHTML = '<p style="text-align:center; color:#999;">Nessuna recensione ancora. Sii il primo a lasciarne una!</p>';
    return;
  }
  
  recentReviewsList.innerHTML = recentReviews.map(review => createReviewCard(review)).join('');
}

// Crea card recensione
function createReviewCard(review) {
  const date = new Date(review.date);
  const formattedDate = date.toLocaleDateString('it-IT', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  
  const imagesHTML = review.images && review.images.length > 0 
    ? `<div class="review-images">
        ${review.images.map(img => `<img src="${img}" alt="Foto recensione" loading="lazy">`).join('')}
       </div>`
    : '';
  
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

// Escape HTML per sicurezza
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Funzione per homepage - mostra recensioni nella home
function displayReviewsOnHomepage() {
  const reviewsGrid = document.querySelector('.reviews-grid');
  if (!reviewsGrid) return;
  
  loadReviews();
  const topReviews = reviews.filter(r => r.verified && r.rating >= 4).slice(0, 6);
  
  if (topReviews.length === 0) {
    reviewsGrid.innerHTML = '<p style="text-align:center; color:#999; grid-column: 1/-1;">Le recensioni stanno arrivando...</p>';
    return;
  }
  
  reviewsGrid.innerHTML = topReviews.map(review => createReviewCard(review)).join('');
}

// Se siamo nella homepage, carica le recensioni
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
  document.addEventListener('DOMContentLoaded', displayReviewsOnHomepage);
}
