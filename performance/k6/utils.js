import { randomBytes } from 'k6/crypto';

export function uuidv4() {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
}

export function randomBetween(min, max) {
  const lower = Number(min);
  const upper = Number(max);
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    throw new Error('randomBetween requires finite numeric bounds');
  }
  if (upper <= lower) {
    return lower;
  }
  const delta = upper - lower;
  return lower + Math.random() * delta;
}

export function sample(collection) {
  if (!Array.isArray(collection) || collection.length === 0) {
    throw new Error('sample requires a non-empty array');
  }
  const index = Math.floor(Math.random() * collection.length);
  return collection[index];
}

export function isoDate(date) {
  if (!date) {
    return new Date().toISOString();
  }
  if (date instanceof Date) {
    return date.toISOString();
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Unable to serialise invalid date value: ${date}`);
  }
  return parsed.toISOString();
}

export function minutesFromNow(minutes) {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60000);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
