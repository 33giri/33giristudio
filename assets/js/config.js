// assets/js/config.js
window.__SUPABASE__ = {
  url: "https://oovqibecarfdoybzbqwt.supabase.co",
  anonKey: "sb_publishable_pOzkEqcT6oMW4pLKv_sWZw_WyCkFC6a"
};

// ✅ crea il client una sola volta
if (!window.__SB_CLIENT__) {
  if (window.supabase?.createClient) {
    window.__SB_CLIENT__ = window.supabase.createClient(
      window.__SUPABASE__.url,
      window.__SUPABASE__.anonKey
    );
  } else {
    console.warn("Supabase SDK non caricato: manca @supabase/supabase-js");
  }
}
