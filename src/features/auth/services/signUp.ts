import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { OpeningHour } from "@/features/ongs";
import { onlyDigits } from "@/lib/masks";
import { createProfile, fetchProfile } from "./profiles";
import type {
  AccountFormInput,
  OngContactFormInput,
  OngDataFormInput,
} from "../model/schema";

/**
 * O cadastro de ONG são 4 gravações em sequência e não há transação pelo
 * client: guardamos em qual delas parou pra poder retomar sem recriar a
 * conta.
 */
export type SignUpStage =
  | "account"
  | "profile"
  | "ong"
  | "contacts"
  | "hours";

export class SignUpError extends Error {
  stage: SignUpStage;

  constructor(stage: SignUpStage, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SignUpError";
    this.stage = stage;
  }
}

function accountErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.code === "user_already_exists" || error.status === 422) {
      return "Já existe uma conta com esse e-mail. Tente entrar ou recuperar a senha.";
    }
    if (error.code === "weak_password") {
      return "Senha muito fraca. Use pelo menos 8 caracteres.";
    }
    return error.message;
  }

  return "Não foi possível criar a conta. Tente novamente.";
}

/**
 * Cria a conta no Auth e garante que a sessão está ativa — sem sessão, a
 * RLS bloqueia todos os INSERTs seguintes (`id = auth.uid()`).
 */
export async function createAccount(account: AccountFormInput) {
  const { data, error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
  });

  if (error) throw new SignUpError("account", accountErrorMessage(error), {
    cause: error,
  });

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (signInError) {
      throw new SignUpError(
        "account",
        "Conta criada, mas não foi possível iniciar a sessão para concluir o cadastro. Se a confirmação de e-mail estiver ativada, confirme o e-mail e entre para finalizar.",
        { cause: signInError },
      );
    }
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new SignUpError("account", "Não foi possível criar a conta.");
  }

  return userId;
}

async function ensureProfile(
  userId: string,
  account: AccountFormInput,
  userType: "donor" | "ong",
) {
  try {
    if (await fetchProfile(userId)) return;

    await createProfile({
      id: userId,
      name: account.name,
      phone: account.phone,
      user_type: userType,
    });
  } catch (error) {
    throw new SignUpError("profile", "Não foi possível salvar seu perfil.", {
      cause: error,
    });
  }
}

export async function registerDonor(
  account: AccountFormInput,
  existingUserId?: string,
): Promise<string> {
  const userId = existingUserId ?? (await createAccount(account));

  await ensureProfile(userId, account, "donor");

  return userId;
}

export async function registerOng(input: {
  account: AccountFormInput;
  data: OngDataFormInput;
  contact: OngContactFormInput;
  hours: OpeningHour[];
  existingUserId?: string;
}): Promise<string> {
  const { account, data, contact, hours } = input;
  const userId = input.existingUserId ?? (await createAccount(account));

  // a policy `ongs_insert_own` chama current_user_type(), que lê profiles:
  // sem o perfil gravado antes, o INSERT da ONG é recusado
  await ensureProfile(userId, account, "ong");

  const ongId = await upsertOng(userId, data, contact);
  await insertContacts(ongId, contact);
  await insertOpeningHours(ongId, hours);

  return userId;
}

async function upsertOng(
  profileId: string,
  data: OngDataFormInput,
  contact: OngContactFormInput,
): Promise<string> {
  const { data: existing, error: lookupError } = await supabase
    .from("ongs")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (lookupError) {
    throw new SignUpError("ong", "Não foi possível salvar os dados da ONG.", {
      cause: lookupError,
    });
  }

  if (existing) return existing.id as string;

  const { data: inserted, error } = await supabase
    .from("ongs")
    .insert({
      profile_id: profileId,
      trade_name: data.trade_name,
      legal_name: data.legal_name,
      cnpj: onlyDigits(data.cnpj),
      mission: data.mission,
      state_id: contact.state_id,
      city_id: contact.city_id,
      neighborhood: contact.neighborhood,
      address: contact.address,
      instagram: contact.instagram || null,
      facebook: contact.facebook || null,
      website: contact.website || null,
      // a policy exige o valor explícito, não basta o default da coluna
      verification_status: "pending",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new SignUpError("ong", "Não foi possível salvar os dados da ONG.", {
      cause: error,
    });
  }

  return inserted.id as string;
}

async function insertContacts(ongId: string, contact: OngContactFormInput) {
  const { count, error: countError } = await supabase
    .from("ong_contacts")
    .select("id", { count: "exact", head: true })
    .eq("ong_id", ongId);

  if (countError) {
    throw new SignUpError("contacts", "Não foi possível salvar os contatos.", {
      cause: countError,
    });
  }

  if (count && count > 0) return;

  const { error } = await supabase.from("ong_contacts").insert(
    contact.contacts.map((item) => ({
      ong_id: ongId,
      number: onlyDigits(item.number),
      whatsapp: item.whatsapp,
    })),
  );

  if (error) {
    throw new SignUpError("contacts", "Não foi possível salvar os contatos.", {
      cause: error,
    });
  }
}

/** Como `insertContacts`: relê antes de gravar, para a retentativa não duplicar. */
async function insertOpeningHours(ongId: string, hours: OpeningHour[]) {
  if (hours.length === 0) return;

  const { count, error: countError } = await supabase
    .from("ong_opening_hours")
    .select("id", { count: "exact", head: true })
    .eq("ong_id", ongId);

  if (countError) {
    throw new SignUpError("hours", "Não foi possível salvar os horários.", {
      cause: countError,
    });
  }

  if (count && count > 0) return;

  const { error } = await supabase.from("ong_opening_hours").insert(
    hours.map((hour) => ({
      ong_id: ongId,
      weekday: hour.weekday,
      opens_at: hour.opens_at,
      closes_at: hour.closes_at,
    })),
  );

  if (error) {
    throw new SignUpError("hours", "Não foi possível salvar os horários.", {
      cause: error,
    });
  }
}
