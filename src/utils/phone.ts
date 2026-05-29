export function normalizePhoneNumber(value = ''): string {
  return String(value).replace(/\D/g, '');
}
