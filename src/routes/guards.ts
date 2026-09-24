import { redirect } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { fetchCurrentProfile, homeFor } from "@/features/auth";

export async function protectedLoader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/login");
  }

  return null;
}

export async function publicOnlyLoader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const profile = await fetchCurrentProfile();

  return redirect(homeFor(profile?.user_type));
}

/** Só o papel `admin` entra no painel de aprovação de ONGs (RF08). */
export async function adminLoader() {
  const profile = await fetchCurrentProfile();

  if (!profile) {
    return redirect("/login");
  }

  if (profile.user_type !== "admin") {
    return redirect(homeFor(profile.user_type));
  }

  return null;
}

/** Área da ONG: painel, cadastro de necessidades. */
export async function ongLoader() {
  const profile = await fetchCurrentProfile();

  if (!profile) {
    return redirect("/login");
  }

  if (profile.user_type !== "ong") {
    return redirect(homeFor(profile.user_type));
  }

  return null;
}

/** Área do doador: histórico de interesses e ONGs seguidas. */
export async function donorLoader() {
  const profile = await fetchCurrentProfile();

  if (!profile) {
    return redirect("/login");
  }

  if (profile.user_type !== "donor") {
    return redirect(homeFor(profile.user_type));
  }

  return null;
}
