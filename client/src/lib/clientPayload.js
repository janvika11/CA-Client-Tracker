/** Aligns optional fields with server Zod / Mongoose rules so partial or invalid values are omitted instead of failing the request. */

const PHONE_RE = /^\+?[0-9\s\-()]{10,}$/;
const WHATSAPP_RE = /^\+?[0-9]{10,}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PIN_RE = /^[0-9]{6}$/;

function optTrim(s) {
  const t = String(s ?? '').trim();
  return t === '' ? undefined : t;
}

export function sanitizeClientPayload(values) {
  const tags = String(values.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const pan = String(values.pan || '').trim().toUpperCase();
  const gstin = String(values.gstin || '').trim().toUpperCase();
  const phone = String(values.phone || '').trim();
  const whatsapp = String(values.whatsapp || '').trim();
  const pincode = String(values.pincode || '').trim();

  const payload = {
    name: String(values.name || '').trim(),
    email: String(values.email || '').trim().toLowerCase(),
    status: values.status,
    tags,
  };

  const firmName = optTrim(values.firmName);
  const contactPerson = optTrim(values.contactPerson);
  const address = optTrim(values.address);
  const city = optTrim(values.city);
  const state = optTrim(values.state);
  if (firmName) payload.firmName = firmName;
  if (contactPerson) payload.contactPerson = contactPerson;
  if (address) payload.address = address;
  if (city) payload.city = city;
  if (state) payload.state = state;

  if (PHONE_RE.test(phone)) payload.phone = phone;
  if (WHATSAPP_RE.test(whatsapp)) payload.whatsapp = whatsapp;
  if (PAN_RE.test(pan)) payload.pan = pan;
  if (GSTIN_RE.test(gstin)) payload.gstin = gstin;
  if (PIN_RE.test(pincode)) payload.pincode = pincode;

  return payload;
}
