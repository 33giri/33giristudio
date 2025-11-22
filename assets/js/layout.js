// Loads header and footer on all pages with a robust fallback for file:// browsing
(function loadLayout() {
  function injectInner(target, incomingHtml, selectorTag) {
    const el = document.getElementById(target);
    if (!el) return;
    try {
      const temp = document.createElement('div');
      temp.innerHTML = incomingHtml.trim();
      const imported = temp.querySelector(selectorTag);
      // If the fetched component wraps content in the same tag, take only its innerHTML
      el.innerHTML = imported ? imported.innerHTML : incomingHtml;
    } catch (e) {
      // If anything goes wrong, drop the entire string as content
      el.innerHTML = incomingHtml;
    }
  }

  async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  }

  // Minimal inline fallbacks
  const headerFallback = [
    '<div class="wrap header-inner">',
    '  <nav class="main-nav">',
    '    <ul>',
    '      <li><a href="index.html">Home</a></li>',
    '      <li><a href="catalogo.html">Catalogo</a></li>',
    '      <li><a href="quiz.html">33Quiz</a></li>',
    '      <li><a href="collaborazioni.html">Collaborazioni</a></li>',
    '      <li><a href="chi_siamo.html">Chi Siamo</a></li>',
    '    </ul>',
    '  </nav>',
  '  <a class="logo" href="index.html" aria-label="33giri logo">',
  '    <img src="assets/logo/33_GIRI._logo-removebg-preview.png" alt="33giri" style="height:120px;">',
    '  </a>',
  '  <div class="header-actions" style="display:flex;align-items:center;gap:18px;">',
  '    <div class="lang-switch" style="font-size:1.1em; letter-spacing:0.04em; display:inline-flex; align-items:center; gap:4px; background:#f7f6f2; border-radius:18px; padding:2px 10px; box-shadow:0 1px 4px rgba(0,0,0,0.04);">',
  '      <span style="font-weight:600; color:#222; display:inline-flex; align-items:center; gap:2px;">',
  '        <img src="https://upload.wikimedia.org/wikipedia/commons/0/03/Flag_of_Italy.svg" alt="IT" style="width:18px; height:13px; vertical-align:middle;"> IT',
  '      </span>',
  '      <span style="color:#888;"> | </span>',
  '      <a href="#" style="color:#222; text-decoration:none; font-weight:400; display:inline-flex; align-items:center; gap:2px;">',
  '        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg" alt="EN" style="width:18px; height:13px; vertical-align:middle;"> EN',
  '      </a>',
  '    </div>',
  '    <a class="icon-btn" aria-label="Account" href="account.html" role="button">👤</a>',
  '  </div>',
    '</div>'
  ].join('\n');

  const footerFallback = [
    '<div class="wrap footer-inner">',
    '  <div>© 33Giri — Made in Italy</div>',
    '  <nav class="footer-nav">',
  '    <a href="informativa-privacy.html">Informativa sulla Privacy</a>',
  '    <a href="faq.html">FAQ</a>',
  '    <a href="resi-rimborsi.html">Resi e Rimborsi</a>',
    '  </nav>',
    '</div>'
  ].join('\n');

  document.addEventListener('DOMContentLoaded', async () => {
    // Ensure the header element has the right class for styling
    const headerEl = document.getElementById('header');
    if (headerEl && !headerEl.classList.contains('site-header')) {
      headerEl.classList.add('site-header');
    }
    // Ensure the footer element has the right class for styling
    const footerElInit = document.getElementById('footer');
    if (footerElInit && !footerElInit.classList.contains('site-footer')) {
      footerElInit.classList.add('site-footer');
    }

    try {
      const [headerHtml, footerHtml] = await Promise.all([
        fetchText('assets/components/header.html'),
        fetchText('assets/components/footer.html')
      ]);
      if (headerEl) injectInner('header', headerHtml, 'header');
  const footerEl = document.getElementById('footer');
  if (footerEl) injectInner('footer', footerHtml, 'footer');
      // Inizializza language switcher dopo che l'header è stato caricato
      if (typeof initLanguageSwitcher === 'function') {
        initLanguageSwitcher();
      }
    } catch (err) {
      // Fallback when running from file:// or fetch fails
      if (headerEl) headerEl.innerHTML = headerFallback;
      const footerEl = document.getElementById('footer');
      if (footerEl) footerEl.innerHTML = footerFallback;
      // Inizializza language switcher anche con fallback
      if (typeof initLanguageSwitcher === 'function') {
        initLanguageSwitcher();
      }
      // console.warn('Layout fallback used:', err);
    }
    
    // Aggiungi il bottone WhatsApp se non esiste già
    if (!document.querySelector('a[href*="wa.me"]')) {
      const whatsappBtn = document.createElement('a');
      whatsappBtn.href = 'https://wa.me/393925430575';
      whatsappBtn.target = '_blank';
      whatsappBtn.rel = 'noopener noreferrer';
      whatsappBtn.style.cssText = 'position: fixed; bottom: 25px; right: 25px; width: 60px; height: 60px; background: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); z-index: 10000; transition: all 0.3s ease; text-decoration: none;';
      whatsappBtn.onmouseover = function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 6px 30px rgba(0, 0, 0, 0.7)';
      };
      whatsappBtn.onmouseout = function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
      };
      whatsappBtn.innerHTML = '<svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#25D366"/></svg>';
      document.body.appendChild(whatsappBtn);
    }
  });
})();
