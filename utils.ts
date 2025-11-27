import { TEXT_MAP } from './constants';
import { Customer } from './types';

export const getBusinessDateKey = (dateObj: Date = new Date()) => {
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0]; 
  if (d.getHours() < 3) {
    d.setTime(d.getTime() - (24 * 60 * 60 * 1000));
  }
  return d.toISOString().split('T')[0];
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
// Checks Name, Address, and specifically the "Address ID" (First word of address)
// Handles "340" matching "C340"
export const findMatchingCustomer = (customers: Customer[], searchTerm: string) => {
    if (!searchTerm) return null;
    const term = searchTerm.toLowerCase().trim();

    return customers.find(c => {
        // 1. Match Name
        if (c.name.toLowerCase().includes(term)) return true;

        // 2. Match Full Address
        if (c.address.toLowerCase().includes(term)) return true;

        // 3. Match Address ID (First Word)
        // e.g. Address "C340 Block 2" -> ID "C340"
        const firstWord = c.address.trim().split(/\s+/)[0].toLowerCase();
        
        // Exact ID match: "c340" === "c340"
        if (firstWord === term) return true;
        
        // Starts with match: "c340" starts with "c3"
        if (firstWord.startsWith(term)) return true;

        // Numeric Match: User types "340", ID is "C340". 
        // Strip letters from ID: "340" === "340"
        const numericId = firstWord.replace(/\D/g, '');
        if (numericId === term && numericId.length > 0) return true;

        return false;
    });
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