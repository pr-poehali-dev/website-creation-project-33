import { Lead } from './types';

export const normalizePhoneNumber = (text: string): string => {
  const digits = text.replace(/\D/g, '');
  
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '7' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '7' + digits;
  }
  if (digits.length === 11 && digits.startsWith('9')) {
    return '7' + digits.slice(1);
  }
  
  return digits.length >= 10 ? '7' + digits.slice(-10) : digits;
};

export const extractPhoneNumbers = (text: string): string[] => {
  const allDigitSequences = text.match(/\d+/g) || [];
  const phones: string[] = [];
  
  allDigitSequences.forEach(seq => {
    if (seq.length >= 10 && seq.length <= 11) {
      const normalized = normalizePhoneNumber(seq);
      if (normalized.length === 11) {
        phones.push(normalized);
      }
    }
  });
  
  return [...new Set(phones)];
};

export const findDuplicatePhones = (leads: Lead[]): Set<string> => {
  const phoneOccurrences = new Map<string, number>();
  
  leads.forEach(lead => {
    if (lead.notes) {
      const phones = extractPhoneNumbers(lead.notes);
      phones.forEach(phone => {
        phoneOccurrences.set(phone, (phoneOccurrences.get(phone) || 0) + 1);
      });
    }
  });
  
  const duplicates = new Set<string>();
  phoneOccurrences.forEach((count, phone) => {
    if (count > 1) {
      duplicates.add(phone);
    }
  });
  
  return duplicates;
};

export const hasDuplicatePhone = (leadNotes: string, duplicatePhones: Set<string>): boolean => {
  if (!leadNotes) return false;
  const phones = extractPhoneNumbers(leadNotes);
  return phones.some(phone => duplicatePhones.has(phone));
};