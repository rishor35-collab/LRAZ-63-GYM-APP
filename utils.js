import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Local-timezone YYYY-MM-DD — avoids the UTC off-by-one bug from toISOString()
export const localDateStr = (value = new Date()) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const localDayOffset = (days, value = new Date()) => {
  const date = new Date(typeof value === 'string' && value.length === 10 ? `${value}T12:00:00` : value);
  date.setDate(date.getDate() + days);
  return localDateStr(date);
};