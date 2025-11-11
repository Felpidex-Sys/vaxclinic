import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timezone de Brasília (America/Sao_Paulo)
const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

export function getBrasiliaDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRASILIA_TIMEZONE }));
}

export function toBrasiliaISOString(date?: Date | string): string {
  const d = date ? new Date(date) : getBrasiliaDate();
  return new Date(d.toLocaleString('en-US', { timeZone: BRASILIA_TIMEZONE })).toISOString();
}

export function formatBrasiliaDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatBrasiliaDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
