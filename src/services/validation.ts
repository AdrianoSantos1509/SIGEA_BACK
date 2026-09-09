export function normalizePersonName(value: unknown): string { return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR"); }
export function isValidEmail(value: unknown): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value ?? "").trim()); }
export function normalizePhone(value: unknown, required = false): string | null { const digits=String(value ?? "").replace(/\D/g, ""); if(!digits){ if(required) throw new Error("O telefone é obrigatório"); return null; } if(digits.length!==11) throw new Error("O telefone deve conter 11 dígitos"); return digits; }
export function dateIsValidRange(startDate: string | null, endDate: string | null): boolean { return Boolean(startDate && endDate && startDate <= endDate); }
export function timeIsValidRange(startTime: string | null, endTime: string | null): boolean { return Boolean(startTime && endTime && startTime < endTime); }

export function onlyDigits(value: unknown): string { return String(value ?? "").replace(/\D/g, ""); }

function cnpjCheckDigit(base: string): number {
  let weight = base.length === 12 ? 5 : 6;
  let sum = 0;
  for (const char of base) {
    sum += Number(char) * weight;
    weight -= 1;
    if (weight < 2) weight = 9;
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCNPJ(value: unknown): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const base = digits.slice(0, 12);
  const firstDigit = cnpjCheckDigit(base);
  const secondDigit = cnpjCheckDigit(base + firstDigit);
  return digits === `${base}${firstDigit}${secondDigit}`;
}

export function isValidCEP(value: unknown): boolean {
  return /^\d{8}$/.test(onlyDigits(value));
}

export function normalizeInstitutionName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeAddress(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}
