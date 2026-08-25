export function normalizePersonName(value: unknown): string { return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR"); }
export function isValidEmail(value: unknown): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value ?? "").trim()); }
export function normalizePhone(value: unknown, required = false): string | null { const digits=String(value ?? "").replace(/\D/g, ""); if(!digits){ if(required) throw new Error("O telefone é obrigatório"); return null; } if(digits.length!==11) throw new Error("O telefone deve conter 11 dígitos"); return digits; }
export function dateIsValidRange(startDate: string | null, endDate: string | null): boolean { return Boolean(startDate && endDate && startDate <= endDate); }
export function timeIsValidRange(startTime: string | null, endTime: string | null): boolean { return Boolean(startTime && endTime && startTime < endTime); }
