import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const missing = [
  !supabaseUrl && "VITE_SUPABASE_URL",
  !supabaseAnonKey && "VITE_SUPABASE_PUBLISHABLE_KEY",
].filter(Boolean);

// sem as chaves o createClient lança "supabaseUrl is required" durante o
// import — o React nem monta e a tela fica branca. A mensagem abaixo é
// exibida pelo fallback de boot do index.html
if (missing.length) {
  throw new Error(
    `Configuração faltando: ${missing.join(" e ")}. ` +
      "Copie .env.example para .env, preencha com as chaves do seu projeto " +
      "Supabase (Settings → API) e reinicie o servidor (npm run dev).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (import.meta.env.DEV) {
  (window as unknown as { supabase: typeof supabase }).supabase = supabase;
}
