import { TEXT_MAP } from './constants';

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

// Advanced parser to handle "two zero four" -> 204, or "nineteen" -> 19
export const parseSpokenNumber = (text: string): string | number | null => {
  if (!text) return null;
  const clean = text.toLowerCase().trim();
  
  // 1. Check if it's already a digit string e.g. "204"
  if (/^\d+$/.test(clean)) return parseInt(clean);

  // 2. Split by spaces to check for sequence of digits e.g. "two zero four"
  const parts = clean.split(/\s+/);
  
  // Convert words to digits
  const mappedParts = parts.map(p => {
    if (/^\d+$/.test(p)) return p; // already a number
    const val = TEXT_MAP[p];
    return val !== undefined ? val : p;
  });

  // If all parts are numbers (single digits or values), join them if they look like a sequence
  // Logic: if user says "two zero four", they mean "204".
  // If user says "one hundred", they mean 100.
  
  // Heuristic: Check if mapped parts contains only numbers
  const allNumbers = mappedParts.every(p => typeof p === 'number' || /^\d+$/.test(String(p)));
  
  if (allNumbers) {
      // If it looks like individual digits (0-9 mostly), join them string-wise
      // e.g. 2, 0, 4 -> "204"
      // But "nineteen" (19) should stay 19.
      // If mix of multi-digit numbers, sum them? No, "hundred" logic is complex.
      // Simple logic for this app context:
      // If user says "two zero four", mapped is [2, 0, 4]. Join -> 204.
      // If user says "nineteen", mapped is [19]. Join -> 19.
      return parseInt(mappedParts.join(''));
  }
  
  // Fallback: try to find any digits in the string
  const digits = String(clean).match(/\d+/);
  if (digits) return parseInt(digits[0]);

  // Fallback: Single word lookup (e.g. "twenty")
  const val = TEXT_MAP[clean];
  if (val !== undefined) return Number(val);

  return null;
};

export const cleanAddressString = (str: string) => {
  // Try to convert "two zero four" at end of string to "204"
  // e.g. "C two zero four" -> "C 204"
  // e.g. "Block A two" -> "Block A 2"
  const parts = str.split(' ');
  const processed = parts.map(p => {
      const val = TEXT_MAP[p.toLowerCase()];
      return val !== undefined ? val : p;
  });
  
  // If we have a letter followed by numbers, join them?
  // User req: "C204" or "204"
  // Let's just return the processed string, the search logic will handle partial matching
  return processed.join('').replace(/\s+/g, ''); // Compact it for address search e.g. C 2 0 4 -> C204
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