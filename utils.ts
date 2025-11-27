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

export const parseNumberFromText = (text: string | number) => {
  const val = normalizeText(String(text));
  if (typeof val === 'number') return val;
  const digits = String(val).match(/\d+/);
  if (digits) return parseInt(digits[0]);
  return null;
};

export const cleanAddressString = (str: string) => {
  return str.split(' ').map(w => normalizeText(w)).join(' ');
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