export const normalizeEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase();
export function validateAuth({ name, email, password, confirmPassword }, registering = false) {
  if (registering && String(name || '').trim().length < 2)
    return 'Enter a name with at least 2 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email)))
    return 'Enter a valid email address.';
  if (String(password || '').length < 8) return 'Use a password with at least 8 characters.';
  if (registering && password !== confirmPassword) return 'Passwords do not match.';
  return null;
}
