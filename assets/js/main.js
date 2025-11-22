// Dynamic include for header and footer
document.addEventListener('DOMContentLoaded', () => {
  // Header
  const headerDiv = document.getElementById('header-include');
  if (headerDiv) {
    fetch('assets/components/header.html')
      .then(res => res.text())
      .then(html => { 
        headerDiv.innerHTML = html; 
        // Inizializza language switcher dopo che l'header è stato caricato
        if (typeof initLanguageSwitcher === 'function') {
          initLanguageSwitcher();
        }
      })
      .catch(err => console.error('Errore caricamento header:', err));
  }
  // Footer
  const footerDiv = document.getElementById('footer-include');
  if (footerDiv) {
    fetch('assets/components/footer.html')
      .then(res => res.text())
      .then(html => { footerDiv.innerHTML = html; });
  }
});
// Carousel functionality + zoom immagini caroselli
document.addEventListener('DOMContentLoaded', () => {
  const carousels = document.querySelectorAll('.carousel-track');
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox ? lightbox.querySelector('.lightbox-img') : null;

  carousels.forEach(track => {
    const carouselId = track.dataset.carousel;
    const prevBtn = document.querySelector(`.carousel-prev[data-carousel="${carouselId}"]`);
    const nextBtn = document.querySelector(`.carousel-next[data-carousel="${carouselId}"]`);
    const slides = track.querySelectorAll('.carousel-slide');

    // If no slides, disable and hide controls and skip setup
    if (!slides || slides.length === 0) {
      if (prevBtn) { prevBtn.disabled = true; prevBtn.style.visibility = 'hidden'; }
      if (nextBtn) { nextBtn.disabled = true; nextBtn.style.visibility = 'hidden'; }
      return;
    }

    let currentIndex = 0;

    function updateCarousel() {
      const offset = -currentIndex * 100;
      track.style.transform = `translateX(${offset}%)`;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
      });
    }

    // Aggiungi zoom stile lightbox alle immagini dei caroselli
    slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (img && lightbox && lbImg) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          lbImg.src = img.src;
          lbImg.alt = img.alt || '';
          lightbox.classList.add('open');
          lightbox.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        });
      }
    });
  });
});

// Simple lightbox per masonry images e caroselli (gestione chiusura X)
document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbClose = lightbox.querySelector('.lightbox-close');

  // Funzione open e close riutilizzabili
  const open = (src, alt='') => {
    lbImg.src = src;
    lbImg.alt = alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 200);
  };

  // Galleria homepage
  const grid = document.querySelector('.masonry-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const link = e.target.closest('a.masonry-item');
      if (!link) return;
      e.preventDefault();
      const img = link.querySelector('img');
      const src = link.getAttribute('href') || (img && img.src);
      open(src, img ? img.alt : '');
    });
  }

  // Chiudi lightbox cliccando X o sfondo
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lbClose) close();
  });
  if (lbClose) {
    lbClose.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
});

// Contact form functionality
document.addEventListener('DOMContentLoaded', () => {
  const contactMethod = document.getElementById('contactMethod');
  const contactInfoGroup = document.getElementById('contactInfoGroup');
  const contactInfo = document.getElementById('contactInfo');
  const contactInfoLabel = document.getElementById('contactInfoLabel');
  const contactForm = document.getElementById('contactForm');
  const messageField = document.getElementById('message');
  const autoSendCheckbox = document.getElementById('autoSend');

  // Update form based on contact method selection
  if (contactMethod) {
    contactMethod.addEventListener('change', (e) => {
      const method = e.target.value;
      
      if (method) {
        contactInfoGroup.style.display = 'block';
        
        // Update label and placeholder based on method
        if (method === 'email') {
          contactInfoLabel.textContent = 'La tua email';
          contactInfo.type = 'email';
          contactInfo.placeholder = 'nome@example.com';
        } else if (method === 'whatsapp') {
          contactInfoLabel.textContent = 'Il tuo numero';
          contactInfo.type = 'tel';
          contactInfo.placeholder = '+39 123 456 7890';
        } else if (method === 'instagram') {
          contactInfoLabel.textContent = 'Il tuo username Instagram';
          contactInfo.type = 'text';
          contactInfo.placeholder = '@username';
        }
        
        contactInfo.value = '';
      } else {
        contactInfoGroup.style.display = 'none';
      }
    });
  }

  // Handle form submission
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const method = contactMethod.value;
      const info = contactInfo.value;
      const message = messageField.value;
      
      if (!method || !info || !message) {
        alert('Per favore compila tutti i campi');
        return;
      }
      
      // Open appropriate contact method
      if (method === 'email') {
        window.location.href = `mailto:${info}?subject=Richiesta da 33Giri&body=${encodeURIComponent(message)}`;
      } else if (method === 'whatsapp') {
        const phoneNumber = info.replace(/[^0-9+]/g, '');
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
      } else if (method === 'instagram') {
        const username = info.replace('@', '');
        window.open(`https://ig.me/m/${username}`, '_blank');
      }
    });
  }

  // Auto-send when all fields are filled (if checkbox is checked)
  if (autoSendCheckbox && contactForm) {
    const checkAndAutoSend = () => {
      if (autoSendCheckbox.checked) {
        const method = contactMethod.value;
        const info = contactInfo.value;
        const message = messageField.value;
        
        if (method && info && message && info.length > 3 && message.length > 5) {
          setTimeout(() => {
            contactForm.dispatchEvent(new Event('submit'));
          }, 500);
        }
      }
    };
    
    contactInfo.addEventListener('input', checkAndAutoSend);
    messageField.addEventListener('input', checkAndAutoSend);
  }
});

// Language switcher IT/EN - Sistema completo multi-pagina
function initLanguageSwitcher() {
  const langSwitch = document.querySelector('.lang-switch');
  if (!langSwitch) return;
  const itBtn = langSwitch.querySelector('span');
  const enBtn = langSwitch.querySelector('a');
  
  // Ottieni lingua salvata o default 'it'
  let currentLang = localStorage.getItem('siteLanguage') || 'it';
  
  // Usa il dizionario globale da translations.js
  if (typeof siteTranslations === 'undefined') {
    console.error('translations.js non caricato');
    return;
  }
  
  // Rileva la pagina corrente
  const path = window.location.pathname;
  let currentPage = 'index';
  if (path.includes('catalogo.html')) currentPage = 'catalogo';
  else if (path.includes('chi_siamo.html')) currentPage = 'chi_siamo';
  else if (path.includes('quiz.html')) currentPage = 'quiz';
  else if (path.includes('collaborazioni.html')) currentPage = 'collaborazioni';
  else if (path.includes('informativa-privacy.html')) currentPage = 'privacy';
  else if (path.includes('faq.html')) currentPage = 'faq';
  else if (path.includes('resi-rimborsi.html')) currentPage = 'returns';
  
  function setLang(lang) {
    // Salva la lingua scelta
    localStorage.setItem('siteLanguage', lang);
    currentLang = lang;
    
    const t = siteTranslations[lang];
    
    // ===== HEADER (tutte le pagine) =====
    const navLinks = document.querySelectorAll('.main-nav a');
    if (navLinks[0]) navLinks[0].textContent = t.navHome;
    if (navLinks[1]) navLinks[1].textContent = t.navCatalogo;
    if (navLinks[2]) navLinks[2].textContent = t.navQuiz;
    if (navLinks[3]) navLinks[3].textContent = t.navCollab;
    if (navLinks[4]) navLinks[4].textContent = t.navChiSiamo;
    
    // ===== FOOTER (tutte le pagine) =====
    const footerCopyright = document.querySelector('.site-footer .footer-inner > div');
    if (footerCopyright) footerCopyright.textContent = t.footerCopyright;
    
    const footerLinks = document.querySelectorAll('.footer-nav a');
    if (footerLinks[0]) footerLinks[0].textContent = t.footerPrivacy;
    if (footerLinks[1]) footerLinks[1].textContent = t.footerFAQ;
    if (footerLinks[2]) footerLinks[2].textContent = t.footerResi;
    
    // ===== PAGE SPECIFIC =====
    
    if (currentPage === 'index') {
      // Homepage - Hero
      const heroTitle = document.querySelector('.hero-title');
      const heroLead = document.querySelector('.hero-lead');
      const btnPrimary = document.querySelector('.hero-cta .btn-primary');
      const btnGhost = document.querySelector('.hero-cta .btn-ghost');
      if (heroTitle) heroTitle.innerHTML = t.heroTitle;
      if (heroLead) heroLead.textContent = t.heroLead;
      if (btnPrimary) btnPrimary.textContent = t.btnAcquista;
      if (btnGhost) btnGhost.textContent = t.btnQuiz;
      
      // Features section
      const features = document.querySelectorAll('.feature');
      if (features[0]) {
        const h3 = features[0].querySelector('h3');
        const p = features[0].querySelector('p');
        if (h3) h3.textContent = t.feature1Title;
        if (p) p.textContent = t.feature1Desc;
      }
      if (features[1]) {
        const h3 = features[1].querySelector('h3');
        const p = features[1].querySelector('p');
        if (h3) h3.textContent = t.feature2Title;
        if (p) p.textContent = t.feature2Desc;
      }
      if (features[2]) {
        const h3 = features[2].querySelector('h3');
        const p = features[2].querySelector('p');
        if (h3) h3.textContent = t.feature3Title;
        if (p) p.textContent = t.feature3Desc;
      }
      
      // Button catalogo
      const btnCatalogo = document.querySelector('.catalogo-btn-wrap .btn');
      if (btnCatalogo) btnCatalogo.textContent = t.btnCatalogo;
      
      // Quiz section
      const quizTitle = document.querySelector('#quiz-hero-section h1');
      const quizDesc = document.querySelector('#quiz-hero-section p');
      const btnTrovaOra = document.querySelector('#quiz-hero-section a');
      if (quizTitle) quizTitle.textContent = t.quizTitle;
      if (quizDesc) quizDesc.innerHTML = t.quizDesc;
      if (btnTrovaOra) btnTrovaOra.textContent = t.btnTrovaOra;
      
      // Package section
      const packageTitle = document.querySelector('.package-section h2');
      const packageSubtitle = document.querySelector('.package-section p');
      if (packageTitle) packageTitle.textContent = t.packageTitle;
      if (packageSubtitle) packageSubtitle.textContent = t.packageSubtitle;
      
      // Package items labels (ordine: packaging, stickers, certificato)
      const packageItems = document.querySelectorAll('.package-item-interactive .package-label span');
      if (packageItems[0]) packageItems[0].textContent = t.packageItem1; // Packaging
      if (packageItems[1]) packageItems[1].textContent = t.packageItem3; // Stickers
      if (packageItems[2]) packageItems[2].textContent = t.packageItem2; // Certificato
    }
    
    else if (currentPage === 'catalogo') {
      // Titolo sezione
      const diTitle = document.querySelector('.di-title');
      if (diTitle) diTitle.textContent = t.catalogoTitle;
      
      // Paragrafi nelle sezioni
      const textBlocks = document.querySelectorAll('.di-text-block p');
      if (textBlocks[0]) textBlocks[0].textContent = t.catalogoPara1;
      if (textBlocks[1]) textBlocks[1].textContent = t.catalogoPara2;
      if (textBlocks[2]) textBlocks[2].textContent = t.catalogoPara3;
      if (textBlocks[3]) textBlocks[3].textContent = t.catalogoPara4;
      if (textBlocks[4]) textBlocks[4].textContent = t.catalogoPara5;
      if (textBlocks[5]) textBlocks[5].textContent = t.catalogoPara6;
      
      // Carousel labels
      const carouselLabels = document.querySelectorAll('.carousel-label');
      if (carouselLabels[0]) carouselLabels[0].textContent = 'NORMAL';
      if (carouselLabels[1]) carouselLabels[1].textContent = 'SPLASH';
      if (carouselLabels[2]) carouselLabels[2].textContent = 'SPIRAL';
      
      // Contact form
      const contactTitle = document.querySelector('.contact-title');
      if (contactTitle) contactTitle.textContent = t.contactTitle;
      
      const contactMethodLabel = document.querySelector('label[for="contactMethod"]');
      if (contactMethodLabel) contactMethodLabel.textContent = t.contactMethodLabel;
      
      const contactInfoLabel = document.querySelector('label[for="contactInfo"]');
      if (contactInfoLabel) contactInfoLabel.textContent = t.contactInfoLabel;
      
      const messageLabel = document.querySelector('label[for="message"]');
      if (messageLabel) messageLabel.textContent = t.messageLabel;
      
      const submitBtn = document.querySelector('.contact-section button[type="submit"]');
      if (submitBtn) submitBtn.textContent = t.submitBtn;
      
      const autoSendLabel = document.querySelector('label[for="auto-send"]');
      if (autoSendLabel) {
        const checkbox = autoSendLabel.querySelector('input[type="checkbox"]');
        autoSendLabel.textContent = '';
        if (checkbox) autoSendLabel.appendChild(checkbox);
        autoSendLabel.appendChild(document.createTextNode(' ' + t.autoSendLabel));
      }
    }
    
    else if (currentPage === 'chi_siamo') {
      // Hero title
      const heroTitle = document.querySelector('#hero-chi-siamo h1');
      if (heroTitle) heroTitle.textContent = t.chiSiamoTitle;
      
      // Sezione principale - primi 4 paragrafi (section.wrap > div con max-width)
      const mainContentDiv = document.querySelector('section.wrap[style*="padding: 4rem"] > div');
      if (mainContentDiv) {
        const paras = mainContentDiv.querySelectorAll('p');
        if (paras[0]) paras[0].textContent = t.chiSiamoPara1;
        if (paras[1]) paras[1].textContent = t.chiSiamoPara2;
        if (paras[2]) paras[2].textContent = t.chiSiamoPara3;
        if (paras[3]) paras[3].textContent = t.chiSiamoPara4;
      }
      
      // Missione section - extra-section
      const missionTitle = document.querySelector('.extra-section h2');
      if (missionTitle) missionTitle.textContent = t.missionTitle;
      
      const missionContentDiv = document.querySelector('.extra-section .wrap > div[style*="flex"]');
      if (missionContentDiv) {
        const missionParas = missionContentDiv.querySelectorAll('p');
        if (missionParas[0]) missionParas[0].innerHTML = t.missionPara1;
        if (missionParas[1]) missionParas[1].textContent = t.missionPara2;
        if (missionParas[2]) missionParas[2].innerHTML = t.missionPara3;
        if (missionParas[3]) missionParas[3].innerHTML = t.missionPara4;
      }
    }
    
    else if (currentPage === 'quiz') {
      // Titolo principale
      const quizTitle = document.querySelector('#quiz-hero-section h1');
      if (quizTitle) quizTitle.textContent = t.quizPageTitle;
      
      // Card blu - paragrafi
      const cardText = document.querySelector('#quiz-hero-section .wrap > div p');
      if (cardText) {
        cardText.innerHTML = t.quizCardText1 + '<br><br>' + 
                            t.quizCardText2 + '<br><br>' + 
                            t.quizCardText3 + '<br><br>' + 
                            t.quizCardText4 + '<br><br>' + 
                            t.quizCardText5;
      }
      
      // Sottotitolo
      const quizSubtitle = document.querySelector('#quiz-hero-section h2');
      if (quizSubtitle) quizSubtitle.textContent = t.quizSubtitle;
    }
    
    else if (currentPage === 'privacy') {
      // Traduzioni pagina Privacy - completa
      if (typeof privacyTranslations !== 'undefined') {
        const pt = privacyTranslations[lang];
        const section = document.querySelector('.privacy-policy');
        
        if (section) {
          section.innerHTML = `
            <h1>${pt.title}</h1>
            <p>${pt.lastUpdate}</p>
            <p>${pt.intro1}</p>
            <p>${pt.intro2}</p>
            
            <h2>${pt.section1.title}</h2>
            <p>${pt.section1.intro}</p>
            <ul>
              ${pt.section1.list.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h2>${pt.section2.title}</h2>
            <ul>
              ${pt.section2.list.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h2>${pt.section3.title}</h2>
            <ul>
              ${pt.section3.list.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h2>${pt.section4.title}</h2>
            <ul>
              ${pt.section4.list.map(item => `<li>${item}</li>`).join('')}
            </ul>
            
            <h2>${pt.section5.title}</h2>
            <p>${pt.section5.content}</p>
            
            <h2>${pt.section6.title}</h2>
            <p>${pt.section6.content}</p>
            
            <h2>${pt.section7.title}</h2>
            <p>${pt.section7.content}</p>
            
            <h2>${pt.section8.title}</h2>
            <ul>
              ${pt.section8.list.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <p>${pt.section8.extra1}</p>
            <ul>
              ${pt.section8.extra2.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <p>${pt.section8.extra3}</p>
            
            <h2>${pt.section9.title}</h2>
            <p>${pt.section9.content}</p>
            
            <h2>${pt.section10.title}</h2>
            <p>${pt.section10.content}</p>
            
            <h2>${pt.section11.title}</h2>
            <p>${pt.section11.content}</p>
            
            <h2>${pt.section12.title}</h2>
            <p>${pt.section12.intro}</p>
            <ul>
              ${pt.section12.list.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <p>${pt.section12.footer}</p>
          `;
        }
      }
    }
    
    else if (currentPage === 'faq') {
      // Titolo e filtri FAQ
      const faqTitle = document.querySelector('#faq-title');
      if (faqTitle) faqTitle.textContent = t.faqTitle;
      
      const faqFilters = document.querySelectorAll('.faq-filter');
      if (faqFilters[0]) faqFilters[0].textContent = t.faqFilterAll;
      if (faqFilters[1]) faqFilters[1].textContent = t.faqFilterShipping;
      if (faqFilters[2]) faqFilters[2].textContent = t.faqFilterReturns;
      if (faqFilters[3]) faqFilters[3].textContent = t.faqFilterProduct;
      if (faqFilters[4]) faqFilters[4].textContent = t.faqFilterCustom;
      
      // Traduci tutte le FAQ se faqTranslations è disponibile
      if (typeof faqTranslations !== 'undefined') {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
          const faqId = item.id;
          if (faqTranslations[lang] && faqTranslations[lang][faqId]) {
            const question = item.querySelector('.q');
            const answer = item.querySelector('.a');
            if (question) question.textContent = faqTranslations[lang][faqId].q;
            if (answer) answer.textContent = faqTranslations[lang][faqId].a;
          }
        });
      }
    }
    
    else if (currentPage === 'returns') {
      // Traduzioni pagina Resi
      if (typeof returnsTranslations !== 'undefined') {
        const rt = returnsTranslations[lang];
        
        const returnsTitle = document.querySelector('main h1');
        if (returnsTitle) returnsTitle.textContent = rt.title;
        
        const paras = document.querySelectorAll('main > p');
        if (paras[0]) paras[0].innerHTML = rt.mainText;
        if (paras[1] && paras[1].querySelector('strong')) {
          paras[1].innerHTML = '<strong>' + rt.damageTitle + '</strong> <br>' + rt.damageText;
        }
        if (paras[2] && paras[2].querySelector('strong')) {
          paras[2].innerHTML = '<strong>' + rt.exceptionsTitle + '</strong> <br>' + rt.exceptionsText;
        }
        if (paras[4] && paras[4].querySelector('strong')) {
          paras[4].innerHTML = '<strong>' + rt.replacementTitle + '</strong> <br>' + rt.replacementText;
        }
        if (paras[5] && paras[5].querySelector('strong')) {
          paras[5].innerHTML = '<strong>' + rt.euTitle + '</strong> <br>' + rt.euText;
        }
        if (paras[6] && paras[6].querySelector('strong')) {
          paras[6].innerHTML = '<strong>' + rt.refundTitle + '</strong> <br>' + rt.refundText;
        }
      }
    }
    
    // Evidenzia lingua attiva nel selettore
    if (lang === 'it') {
      itBtn.style.fontWeight = '600';
      enBtn.style.fontWeight = '400';
    } else {
      itBtn.style.fontWeight = '400';
      enBtn.style.fontWeight = '600';
    }
  }
  
  // Click su EN
  enBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setLang('en');
  });
  
  // Click su IT
  itBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setLang('it');
  });
  
  // Applica la lingua salvata al caricamento
  setLang(currentLang);
}
