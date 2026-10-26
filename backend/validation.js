export const services = ['Ayurvedic consultation', 'Panchakarma therapy', 'In-house dispensary', 'Herbal formulations', 'General enquiry'];
export function todayInIndia() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = type => parts.find(value => value.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function validateEnquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'A JSON object is required.' };
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const service = body.service;
  const preferredDate = body.preferredDate || null;
  if (name.length < 2 || name.length > 80 || /[<>\x00-\x1f]/u.test(name)) return { error: 'Enter a name between 2 and 80 characters.' };
  const digits = phone.replace(/\D/g, '');
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone) || digits.length < 7 || digits.length > 15) return { error: 'Enter a valid phone number with 7–15 digits.' };
  if (!services.includes(service)) return { error: 'Select an available service.' };
  if (body.consent !== true) return { error: 'Consent is required to store and process your enquiry.' };
  if (preferredDate !== null) {
    if (typeof preferredDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return { error: 'Choose a valid date.' };
    const date = new Date(preferredDate + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== preferredDate) return { error: 'Choose a valid date.' };
    const today = todayInIndia();
    const latest = new Date(today + 'T00:00:00Z');
    latest.setUTCFullYear(latest.getUTCFullYear() + 1);
    if (preferredDate < today || preferredDate > latest.toISOString().slice(0, 10)) return { error: 'Choose a date within the next year.' };
  }
  return { value: { name, phone, service, preferredDate } };
}
