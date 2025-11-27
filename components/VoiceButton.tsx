import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './UI';
import { cleanAddressString, parseSpokenNumber } from '../utils';

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const VoiceButton = ({ onCommand, showToast, mode = "cash", inline = false }: any) => {
    const [isListening, setIsListening] = useState(false);
    const [displayTranscript, setDisplayTranscript] = useState("");
    const recognitionRef = useRef<any>(null);
    const silenceTimer = useRef<any>(null);
    const hasExecutedRef = useRef(false);
    const onCommandRef = useRef(onCommand);
    
    useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);

    const stopRecognition = () => {
       if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} recognitionRef.current = null; }
       clearTimeout(silenceTimer.current);
    };

    const startListening = () => {
      stopRecognition();
      setIsListening(true); 
      setDisplayTranscript("Listening... (Say '... and ...')"); 
      hasExecutedRef.current = false;
      
      if (!SpeechRecognition) { if(showToast) showToast("Voice Not Supported", "error"); return; }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // We want one command string
      recognition.interimResults = true; 
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onerror = (e: any) => { 
          if(e.error !== 'no-speech') { 
              setIsListening(false); 
              setDisplayTranscript("Error"); 
          } else { 
              setIsListening(false); 
              setDisplayTranscript(""); 
          } 
      };
      
      recognition.onend = () => { setIsListening(false); };
      
      recognition.onresult = (e: any) => {
         let final = ""; 
         for (let i = e.resultIndex; i < e.results.length; ++i) final += e.results[i][0].transcript;
         
         // Normalize: lowercase, standard 'and'
         const cleaned = final.toLowerCase()
             .replace(/&/g, "and")
             .replace(/\+/g, "and")
             .trim();
             
         setDisplayTranscript(final);

         // 1. Split strictly by "and"
         // This allows complex phrases like "two zero four" to remain in one chunk
         const rawParts = cleaned.split(/\sand\s|\sand$|^and\s/);
         const parts = rawParts.map(p => p.trim()).filter(p => p.length > 0);

         let extractedData: any[] = [];

         if (mode === "credit") {
             // Expectation: [Address, Qty, Variant, Delivery(opt)]
             // e.g. "204" AND "5" AND "19" AND "20"
             if (parts.length >= 1) {
                 // Part 1: Address Identity (e.g. "C two zero four" or "204")
                 const addrRaw = parts[0];
                 // If it's pure numbers spoken like "two zero four", parseSpokenNumber handles it
                 // If it has letters "C two zero four", we need cleanAddressString
                 let addr = "";
                 
                 // Try numeric parse first (for "two zero four")
                 const numParse = parseSpokenNumber(addrRaw);
                 if (numParse !== null && String(numParse).length >= 2) {
                     addr = String(numParse);
                 } else {
                     // Alphanumeric
                     addr = cleanAddressString(addrRaw);
                 }

                 extractedData.push(addr); // Index 0: Address

                 // Remaining parts should be numbers
                 for (let i = 1; i < parts.length; i++) {
                     const val = parseSpokenNumber(parts[i]);
                     if (val !== null) extractedData.push(val);
                 }
             }
         } else {
             // Cash Mode
             // Expectation: [Qty, Variant, Delivery(opt)]
             // e.g. "5" AND "19" AND "20"
             for (let i = 0; i < parts.length; i++) {
                 const val = parseSpokenNumber(parts[i]);
                 if (val !== null) extractedData.push(val);
             }
         }

         const requiredLen = mode === "credit" ? 3 : 2; // Credit: Addr, Qty, Var. Cash: Qty, Var.

         // Debounce execution
         if (extractedData.length >= requiredLen) { 
             clearTimeout(silenceTimer.current); 
             processCommand(extractedData); 
         } else { 
             clearTimeout(silenceTimer.current); 
             silenceTimer.current = setTimeout(() => processCommand(extractedData), 3500); 
         }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    };

    const processCommand = (data?: any[]) => {
       if (hasExecutedRef.current) return;
       if (recognitionRef.current) recognitionRef.current.stop();
       
       if (data && data.length >= 2) {
           hasExecutedRef.current = true;
           
           if (mode === "credit") {
               // [Address, Qty, Variant, Delivery?]
               const addr = data[0]; 
               const qty = data[1]; 
               const vari = String(data[2]); 
               const del = data.length > 3 ? data[3] : 0;
               
               onCommandRef.current(qty, vari, del, addr);
           } else {
               // [Qty, Variant, Delivery?]
               const qty = data[0]; 
               const vari = String(data[1]); 
               const del = data.length > 2 ? data[2] : 0;
               
               onCommandRef.current(qty, vari, del);
           }
           setDisplayTranscript("Done!");
       } else {
           setDisplayTranscript("Cmd Incomplete");
       }
    };

    if (inline) {
         return (
            <div className="flex flex-col items-center justify-center relative">
                 {isListening && <div className="absolute -top-10 bg-black/90 text-white px-3 py-2 rounded text-xs font-mono whitespace-nowrap z-50 border border-green-500 shadow-xl">{displayTranscript}</div>}
                 
                 <button onClick={isListening ? ()=>processCommand() : startListening} className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${isListening ? "bg-green-500 animate-pulse ring-4 ring-green-200" : "bg-red-600"}`}>
                    <Icon name={isListening?"mic":"mic-off"} size={26} className="text-white"/>
                 </button>
            </div>
         )
    }

    return (
      <div className="fixed z-[100] bottom-32 right-6 md:bottom-12 md:right-12 flex flex-col items-end gap-2 pointer-events-none">
        {isListening && <div className="bg-black/90 text-white px-4 py-2 rounded-xl text-xs font-mono animate-fade-in mb-2 pointer-events-auto border-2 border-green-500 shadow-xl">{displayTranscript}</div>}
        <button onClick={isListening ? ()=>processCommand() : startListening} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl pointer-events-auto transition-all ${isListening ? "bg-green-500 animate-pulse text-white ring-4 ring-green-300" : "bg-red-500 text-white"}`}><Icon name={isListening?"mic":"mic-off"} size={32}/></button>
      </div>
    );
};