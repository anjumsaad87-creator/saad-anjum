import { TEXT_MAP } from './constants';
import { Customer, Product } from './types';

// Helper to get Date Parts strictly in Pakistan Time (Asia/Karachi)
const getPKTDateParts = (dateObj: Date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(dateObj);
  const getVal = (t: string) => parseInt(parts.find(p => p.type === t)?.value || "0");

  return {
      year: getVal('year'),
      month: getVal('month'),
      day: getVal('day'),
      hour: getVal('hour'),
      minute: getVal('minute')
  };
};

// Returns YYYY-MM-DD based on PKT, adjusting for 3 AM business cutoff
export const getBusinessDateKey = (dateObj: Date = new Date()) => {
  const dObj = new Date(dateObj);
  if (isNaN(dObj.getTime())) return getTodayDatePKT();

  const pkt = getPKTDateParts(dObj);
  
  // Construct a temporary date to handle day subtraction logic easily.
  // We use the PKT values as "Local" values for this math object.
  const calcDate = new Date(pkt.year, pkt.month - 1, pkt.day);
  
  // Business Logic: 3 AM Cutoff (PKT)
  // If current PKT hour < 3, it belongs to previous date
  if (pkt.hour < 3) {
    calcDate.setDate(calcDate.getDate() - 1);
  }
  
  const y = calcDate.getFullYear();
  const m = String(calcDate.getMonth() + 1).padStart(2, '0');
  const d = String(calcDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Returns strict YYYY-MM-DD for today in PKT (Calendar Date)
export const getTodayDatePKT = () => {
    const pkt = getPKTDateParts(new Date());
    const y = pkt.year;
    const m = String(pkt.month).padStart(2, '0');
    const d = String(pkt.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Returns strict Day Name (Monday, Tuesday) in PKT
export const getCurrentDayNamePKT = () => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'long'
  }).format(new Date());
};

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

export const formatCurrency = (amount: number = 0) => {
  return "Rs. " + (Number(amount) || 0).toLocaleString("en-IN");
};

export const normalizeText = (text: string) => {
  if(!text) return "";
  const lower = text.toLowerCase().trim();
  return TEXT_MAP[lower] !== undefined ? TEXT_MAP[lower] : text;
};

// Advanced parser to handle "two zero four" -> 204
export const parseSpokenNumber = (text: string): string | number | null => {
  if (!text) return null;
  const clean = text.toLowerCase().trim();
  
  // If it's a pure number string "204"
  if (/^\d+$/.test(clean)) return parseInt(clean);

  // If mixed alphanumeric like "c340" or "c 340"
  if (/[a-z]/i.test(clean) && /\d/.test(clean)) {
      // Remove spaces, keep as string identity
      return clean.replace(/\s+/g, '').toUpperCase(); 
  }

  // Try to parse words "two hundred"
  const parts = clean.split(/\s+/);
  const mappedParts = parts.map(p => {
    if (/^\d+$/.test(p)) return p;
    const val = TEXT_MAP[p];
    return val !== undefined ? val : p;
  });

  const allNumbers = mappedParts.every(p => typeof p === 'number' || /^\d+$/.test(String(p)));
  
  if (allNumbers) {
      return parseInt(mappedParts.join(''));
  }
  
  // Fallback: extract first sequence of digits
  const digits = String(clean).match(/\d+/);
  if (digits) return parseInt(digits[0]);

  const val = TEXT_MAP[clean];
  if (val !== undefined) return Number(val);

  return null;
};

export const cleanAddressString = (str: string) => {
  const parts = str.split(' ');
  const processed = parts.map(p => {
      const val = TEXT_MAP[p.toLowerCase()];
      return val !== undefined ? val : p;
  });
  return processed.join('').replace(/\s+/g, ''); 
};

// NEW: Smart Customer Matcher
export const findMatchingCustomer = (customers: Customer[], searchTerm: string) => {
    if (!searchTerm) return null;
    const term = searchTerm.toLowerCase().trim();

    return customers.find(c => {
        if (c.name.toLowerCase().includes(term)) return true;
        if (c.address.toLowerCase().includes(term)) return true;
        const firstWord = c.address.trim().split(/\s+/)[0].toLowerCase();
        if (firstWord === term) return true;
        if (firstWord.startsWith(term)) return true;
        const numericId = firstWord.replace(/\D/g, '');
        if (numericId === term && numericId.length > 0) return true;
        return false;
    });
};

// NEW: Smart Product Matcher (Name or Keywords)
export const findProductByKeyword = (products: Product[], searchTerm: string) => {
    if (!searchTerm) return null;
    const term = searchTerm.toLowerCase().trim();
    
    // Priority 1: Exact Keyword Match (Voice Code)
    // strict check to ensure "1" doesn't match "19"
    const exactCode = products.find(p => p.keywords && p.keywords.trim() === term);
    if (exactCode) return exactCode;

    // Priority 2: Name contains term (Fallback)
    return products.find(p => p.name.toLowerCase().includes(term));
};

// Filter function for lists
export const filterCustomers = (customers: Customer[], searchTerm: string) => {
    if (!searchTerm) return customers;
    const term = searchTerm.toLowerCase().trim();
    return customers.filter(c => {
        if (c.name.toLowerCase().includes(term)) return true;
        if (c.address.toLowerCase().includes(term)) return true;
        const firstWord = c.address.trim().split(/\s+/)[0].toLowerCase();
        const numericId = firstWord.replace(/\D/g, '');
        return firstWord.includes(term) || (numericId === term && numericId.length > 0);
    });
};

export const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; 
    window.speechSynthesis.speak(utterance);
  }
};

export const exportToCSV = (filename: string, rows: any[]) => {
  const processRow = (row: any[]) => {
      let finalVal = '';
      for (let j = 0; j < row.length; j++) {
          let innerValue = row[j] === null ? '' : row[j].toString();
          if (row[j] instanceof Date) {
              innerValue = row[j].toLocaleString();
          };
          let result = innerValue.replace(/"/g, '""');
          if (result.search(/("|,|\n)/g) >= 0)
              result = '"' + result + '"';
          if (j > 0)
              finalVal += ',';
          finalVal += result;
      }
      return finalVal + '\n';
  };

  let csvFile = '';
  for (let i = 0; i < rows.length; i++) {
      csvFile += processRow(rows[i]);
  }

  const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  // @ts-ignore
  if (navigator.msSaveBlob) { 
      // @ts-ignore
      navigator.msSaveBlob(blob, filename);
  } else {
      const link = document.createElement("a");
      if (link.download !== undefined) { 
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }
};