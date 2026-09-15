const COMPANY_HINT =
  /\b(ltda|eireli|mei|me\b|sa\b|s\/a|operadora|clinica|clínica|turismo|imobiliaria|imobiliária|hotel|escola|igreja|associacao|associação|comercio|comércio|store|oficial|suporte|rh\/|dp\b)\b/i;

const SPOKEN_NAME =
  /(?:meu nome e|meu nome é|me chamo|pode me chamar de|sou o|sou a|eu sou(?: o| a)?)\s+([A-Za-zÀ-ÿ]{2,20})(?:\s+([A-Za-zÀ-ÿ]{2,20}))?/i;

const NAME_STOP = /^(o|a|um|uma|de|da|do|sistema|cliente|crm|site)$/i;

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function extractSpokenName(text: string): string | null {
  const m = text.match(SPOKEN_NAME);
  if (!m?.[1] || NAME_STOP.test(m[1]) || COMPANY_HINT.test(m[1])) return null;
  const bits = [m[1], m[2]].filter(
    (w): w is string => !!w && !NAME_STOP.test(w),
  );
  return bits.map(titleCaseWord).join(" ");
}

export function firstNameFromDisplay(name: string | null | undefined): string | null {
  const raw = (name ?? "").trim();
  if (!raw) return null;
  if (/^\+?\d[\d\s()-]{6,}$/.test(raw)) return null;
  if (COMPANY_HINT.test(raw)) return null;
  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first || first.length < 2) return null;
  if (!/^[\p{L}]+$/u.test(first)) return null;
  if (parts.length === 1 && first.length > 16) return null;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/** True when the CRM name is a WhatsApp push name / company, not a person. */
export function needsPersonalName(name: string | null | undefined): boolean {
  return firstNameFromDisplay(name) === null;
}
