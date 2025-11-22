(function(){
  // Simple localStorage-based auth + favorites/lists management
  const USERS_KEY = 'auth.users'; // map email -> {password}
  const CURRENT_KEY = 'auth.current'; // email string
  const USER_DATA_KEY = (email) => `user.${email}.data`;
  // EmailJS configuration (replace placeholders with your real keys)
  const EMAILJS_PUBLIC_KEY = 'kpubOlioViWS1xOzc';
  const EMAILJS_SERVICE_ID = 'service_epi5tx8';
  const EMAILJS_TEMPLATE_ID = 'template_6xo01uf';

  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
  }
  function saveUsers(map) { localStorage.setItem(USERS_KEY, JSON.stringify(map)); }
  function setCurrent(email) { if (email) localStorage.setItem(CURRENT_KEY, email); else localStorage.removeItem(CURRENT_KEY); }
  function getCurrent() { return localStorage.getItem(CURRENT_KEY) || null; }
  function loadUserData(email) {
    try { return JSON.parse(localStorage.getItem(USER_DATA_KEY(email)) || '{"favorites":[],"lists":[]}'); } catch { return {favorites:[], lists:[]}; }
  }
  function saveUserData(email, data) { localStorage.setItem(USER_DATA_KEY(email), JSON.stringify(data)); }

  // Helpers
  const slug = (s) => s.toString().toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

  // Helper: check if EmailJS is properly configured
  function isEmailJsReady() {
    return (
      typeof window !== 'undefined' &&
      window.emailjs &&
      EMAILJS_PUBLIC_KEY && !EMAILJS_PUBLIC_KEY.startsWith('REPLACE_') &&
      EMAILJS_SERVICE_ID && !EMAILJS_SERVICE_ID.startsWith('REPLACE_') &&
      EMAILJS_TEMPLATE_ID && !EMAILJS_TEMPLATE_ID.startsWith('REPLACE_')
    );
  }

  // Helper: send confirmation email
  function sendConfirmationEmail(toEmail) {
    // Block sending when running from file:// which EmailJS does not allow
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
      const err = new Error('Invio email non supportato da file://');
      err.code = 'file_protocol';
      return Promise.reject(err);
    }
    if (!isEmailJsReady()) {
      console.warn('EmailJS non configurato: salta invio email.');
      return Promise.resolve({ skipped: true });
    }
    try {
      // Init once per page load (safe to call multiple times)
      window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    } catch (e) {
      // ignore if already initialized
    }
    const params = {
      to_email: toEmail,
      subject: 'Conferma registrazione — 33Giri',
      message: 'Grazie per esserti registrato su 33Giri. La tua registrazione è avvenuta con successo!',
      site_name: '33Giri',
      site_url: (location && (location.origin + location.pathname.replace(/[^/]+$/, 'index.html'))) || 'index.html'
    };
    return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
  }

  // Auth UI
  document.addEventListener('DOMContentLoaded', () => {
    const authSection = qs('#authSection');
    const accountSection = qs('#accountSection');
    const userEmailSpan = qs('#userEmail');
    const logoutBtn = qs('#logoutBtn');

    const loginForm = qs('#loginForm');
    const loginEmail = qs('#loginEmail');
    const loginPassword = qs('#loginPassword');

    const registerForm = qs('#registerForm');
    const regEmail = qs('#regEmail');
    const regPassword = qs('#regPassword');
    const regPassword2 = qs('#regPassword2');

    const newFavoriteForm = qs('#newFavoriteForm');
    const favTitle = qs('#favTitle');
    const favImage = qs('#favImage');
    const favoritesList = qs('#favoritesList');

    const newListForm = qs('#newListForm');
    const listName = qs('#listName');
    const listsContainer = qs('#listsContainer');

    function refreshUI() {
      const current = getCurrent();
      if (!current) {
        if (authSection) authSection.style.display = '';
        if (accountSection) accountSection.style.display = 'none';
        return;
      }
      if (authSection) authSection.style.display = 'none';
      if (accountSection) accountSection.style.display = '';
      if (userEmailSpan) userEmailSpan.textContent = current;
      renderFavorites();
      renderLists();
    }

    // Auth handlers
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (loginEmail.value || '').trim().toLowerCase();
        const pass = loginPassword.value || '';
        const users = loadUsers();
        if (!users[email] || users[email].password !== pass) {
          alert('Credenziali non valide');
          return;
        }
        setCurrent(email);
        loginForm.reset();
        // Redirect alla home page dopo login
        window.location.href = 'index.html';
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = (regEmail.value || '').trim().toLowerCase();
        const pass = regPassword.value || '';
        const pass2 = regPassword2.value || '';
        if (!email || !pass) { alert('Compila email e password'); return; }
        if (pass.length < 6) { alert('La password deve avere almeno 6 caratteri'); return; }
        if (pass !== pass2) { alert('Le password non coincidono'); return; }
        const users = loadUsers();
        if (users[email]) { alert('Esiste già un account con questa email'); return; }
        users[email] = { password: pass };
        saveUsers(users);
        setCurrent(email);
        // Init empty data for the user
        saveUserData(email, { favorites: [], lists: [] });
        // Invio email di conferma (reale via EmailJS se configurato)
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Invio conferma…'; }
        try {
          await sendConfirmationEmail(email);
          alert('Registrazione avvenuta! Ti abbiamo inviato una mail di conferma a ' + email + '.');
        } catch (err) {
          console.error('Errore invio email di conferma:', err);
          if (err && (err.code === 'file_protocol')) {
            alert('Registrazione avvenuta! Nota: per inviare l\'email di conferma avvia il sito su http://localhost (non da file://) e aggiungi quel dominio nella dashboard di EmailJS (Allowed Origins).');
          } else if (err && (String(err.message||'')+String(err.text||'')).includes('origin')) {
            alert('Registrazione avvenuta! Nota: aggiungi il dominio corrente alla whitelist EmailJS (Allowed Origins) e usa HTTP/HTTPS.');
          } else {
            alert('Registrazione avvenuta! (Attenzione: invio email non riuscito).');
          }
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        }
        // Reindirizza alla home page dopo la registrazione
        window.location.href = 'index.html';
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        setCurrent(null);
        refreshUI();
      });
    }

    // Favorites
    function renderFavorites() {
      const current = getCurrent();
      if (!current || !favoritesList) return;
      const data = loadUserData(current);
      if (!Array.isArray(data.favorites)) data.favorites = [];
      favoritesList.innerHTML = '';
      if (data.favorites.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nessun preferito ancora. Aggiungine uno.';
        li.style.color = '#444';
        favoritesList.appendChild(li);
        return;
      }
      data.favorites.forEach(item => {
        const li = document.createElement('li');
        li.style.display = 'grid';
        li.style.gridTemplateColumns = '48px 1fr auto';
        li.style.gap = '10px';
        li.style.alignItems = 'center';
        const img = document.createElement('img');
        img.src = item.image || 'assets/logo/33_GIRI._logo-removebg-preview.png';
        img.alt = item.title;
        img.style.width = '48px';
        img.style.height = '48px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        const title = document.createElement('div');
        title.textContent = item.title;
        const actions = document.createElement('div');
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-ghost';
        removeBtn.textContent = 'Rimuovi';
        removeBtn.addEventListener('click', () => {
          removeFavorite(item.id);
        });
        actions.appendChild(removeBtn);
        li.appendChild(img);
        li.appendChild(title);
        li.appendChild(actions);
        favoritesList.appendChild(li);
      });
    }

    function addFavoriteFromForm(e) {
      e.preventDefault();
      const current = getCurrent();
      if (!current) return;
      const title = (favTitle.value || '').trim();
      const image = (favImage.value || '').trim();
      if (!title) return;
      const id = slug(title) + '-' + uid();
      const data = loadUserData(current);
      data.favorites = data.favorites || [];
      data.favorites.unshift({ id, title, image });
      saveUserData(current, data);
      newFavoriteForm.reset();
      renderFavorites();
      renderLists();
    }

    if (newFavoriteForm) newFavoriteForm.addEventListener('submit', addFavoriteFromForm);

    function removeFavorite(id) {
      const current = getCurrent();
      if (!current) return;
      const data = loadUserData(current);
      data.favorites = (data.favorites || []).filter(f => f.id !== id);
      // Also remove from lists
      data.lists = (data.lists || []).map(l => ({...l, items: (l.items||[]).filter(x => x !== id)}));
      saveUserData(current, data);
      renderFavorites();
      renderLists();
    }

    // Lists
    function renderLists() {
      const current = getCurrent();
      if (!current || !listsContainer) return;
      const data = loadUserData(current);
      const favs = data.favorites || [];
      const lists = data.lists || [];
      listsContainer.innerHTML = '';
      if (lists.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'Nessuna lista creata.';
        empty.style.color = '#444';
        listsContainer.appendChild(empty);
        return;
      }
      lists.forEach(list => {
        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.border = '1px solid #e7dfd7';
        box.style.borderRadius = '10px';
        box.style.padding = '12px';
        box.style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)';

        const head = document.createElement('div');
        head.style.display = 'flex';
        head.style.justifyContent = 'space-between';
        head.style.alignItems = 'center';
        const title = document.createElement('h4');
        title.textContent = list.name;
        title.style.margin = '0';
        const del = document.createElement('button');
        del.className = 'btn btn-ghost';
        del.textContent = 'Elimina lista';
        del.addEventListener('click', () => deleteList(list.id));
        head.appendChild(title);
        head.appendChild(del);

        const addWrap = document.createElement('div');
        addWrap.style.display = 'flex';
        addWrap.style.gap = '8px';
        addWrap.style.margin = '10px 0';
        const select = document.createElement('select');
        select.className = 'form-select';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Scegli dai preferiti...';
        select.appendChild(defaultOpt);
        favs.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.id;
          opt.textContent = f.title;
          select.appendChild(opt);
        });
        const addBtn = document.createElement('button');
        addBtn.className = 'btn';
        addBtn.textContent = 'Aggiungi';
        addBtn.addEventListener('click', () => {
          const val = select.value;
          if (!val) return;
          addToList(list.id, val);
        });
        addWrap.appendChild(select);
        addWrap.appendChild(addBtn);

        const itemsWrap = document.createElement('div');
        itemsWrap.style.display = 'grid';
        itemsWrap.style.gridTemplateColumns = 'repeat(auto-fit,minmax(180px,1fr))';
        itemsWrap.style.gap = '10px';
        (list.items || []).forEach(id => {
          const fav = favs.find(f => f.id === id);
          if (!fav) return;
          const card = document.createElement('div');
          card.style.border = '1px solid #eee';
          card.style.borderRadius = '10px';
          card.style.overflow = 'hidden';
          const img = document.createElement('img');
          img.src = fav.image || 'assets/logo/33_GIRI._logo-removebg-preview.png';
          img.alt = fav.title;
          img.style.width = '100%';
          img.style.height = '120px';
          img.style.objectFit = 'cover';
          const cap = document.createElement('div');
          cap.style.padding = '8px';
          cap.textContent = fav.title;
          const rm = document.createElement('button');
          rm.className = 'btn btn-ghost';
          rm.textContent = 'Rimuovi';
          rm.style.margin = '8px';
          rm.addEventListener('click', () => removeFromList(list.id, id));
          card.appendChild(img);
          card.appendChild(cap);
          card.appendChild(rm);
          itemsWrap.appendChild(card);
        });

        box.appendChild(head);
        box.appendChild(addWrap);
        box.appendChild(itemsWrap);
        listsContainer.appendChild(box);
      });
    }

    function createList(name) {
      const current = getCurrent();
      if (!current) return;
      const data = loadUserData(current);
      const id = uid();
      data.lists = data.lists || [];
      data.lists.unshift({ id, name, items: [] });
      saveUserData(current, data);
      renderLists();
      newListForm && newListForm.reset();
    }
    function deleteList(id) {
      const current = getCurrent();
      if (!current) return;
      const data = loadUserData(current);
      data.lists = (data.lists || []).filter(l => l.id !== id);
      saveUserData(current, data);
      renderLists();
    }
    function addToList(listId, itemId) {
      const current = getCurrent();
      if (!current) return;
      const data = loadUserData(current);
      const list = (data.lists || []).find(l => l.id === listId);
      if (!list) return;
      list.items = list.items || [];
      if (!list.items.includes(itemId)) list.items.push(itemId);
      saveUserData(current, data);
      renderLists();
    }
    function removeFromList(listId, itemId) {
      const current = getCurrent();
      if (!current) return;
      const data = loadUserData(current);
      const list = (data.lists || []).find(l => l.id === listId);
      if (!list) return;
      list.items = (list.items || []).filter(x => x !== itemId);
      saveUserData(current, data);
      renderLists();
    }

    if (newListForm) {
      newListForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = (listName.value || '').trim();
        if (!name) return;
        createList(name);
      });
    }

    // Expose a tiny API globally so other pages can add favorites
    window.Favorites = {
      isLoggedIn: () => !!getCurrent(),
      currentEmail: () => getCurrent(),
      add: (item) => {
        const current = getCurrent();
        if (!current) { alert('Devi accedere per salvare preferiti'); return false; }
        const data = loadUserData(current);
        data.favorites = data.favorites || [];
        if (!item.id) item.id = slug(item.title || 'item') + '-' + uid();
        if (data.favorites.find(f => f.id === item.id)) return true;
        data.favorites.unshift({ id: item.id, title: item.title || 'Senza titolo', image: item.image || '' });
        saveUserData(current, data);
        renderFavorites();
        renderLists();
        return true;
      },
      remove: (id) => { removeFavorite(id); },
      list: () => {
        const current = getCurrent();
        if (!current) return [];
        return (loadUserData(current).favorites || []).slice();
      }
    };

    refreshUI();
  });
})();
