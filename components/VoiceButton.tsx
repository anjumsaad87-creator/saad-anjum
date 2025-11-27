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
      setDisplayTranscript("Listening..."); 
      hasExecutedRef.current = false;
      
      if (!SpeechRecognition) { if(showToast) showToast("Voice Not Supported", "error"); return; }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false; 
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
         
         // Normalize "and"
         const cleaned = final.toLowerCase()
             .replace(/&/g, "and")
             .replace(/\+/g, "and")
             .trim();
             
         setDisplayTranscript(final);

         // STRICT SPLIT by "and"
         const rawParts = cleaned.split(/\sand\s|\sand$|^and\s/);
         const parts = rawParts.map(p => p.trim()).filter(p => p.length > 0);

         // AUTO DETECTION LOGIC
         let currentMode = mode;
         if (mode === 'auto' && parts.length > 0) {
             const firstPart = parts[0];
             const firstAsNum = parseSpokenNumber(firstPart);
             const isNum = firstAsNum !== null && typeof firstAsNum === 'number';
             
             // Rule: If first number is big (>50) or Alphanumeric -> Credit (Address ID)
             // Rule: If first number is small (<=50) -> Cash (Quantity)
             const hasLetters = /[a-z]/i.test(firstPart) && !/zero|one|two|three|four|five|six|seven|eight|nine|ten/i.test(firstPart);

             if (hasLetters || (isNum && (firstAsNum as number) > 50)) {
                 currentMode = 'credit';
             } else {
                 currentMode = 'cash';
             }
         }

         let extractedData: any[] = [];
         
         if (currentMode === "credit") {
             // Structure: [Address, Qty, Variant, Delivery?]
             if (parts.length > 0) extractedData[0] = parts[0]; // Address/ID
             if (parts.length > 1) extractedData[1] = parseSpokenNumber(parts[1]); // Qty
             if (parts.length > 2) extractedData[2] = parseSpokenNumber(parts[2]); // Variant
             if (parts.length > 3) extractedData[3] = parseSpokenNumber(parts[3]); // Delivery
         } else {
             // CASH Mode
             // Structure: [Qty, Variant, Delivery?]
             if (parts.length > 0) extractedData[0] = parseSpokenNumber(parts[0]); // Qty
             if (parts.length > 1) extractedData[1] = parseSpokenNumber(parts[1]); // Variant
             if (parts.length > 2) extractedData[2] = parseSpokenNumber(parts[2]); // Delivery
         }

         // Validation Counts
         const requiredLen = currentMode === "credit" ? 3 : 2; // Min fields needed
         const maxLen = currentMode === "credit" ? 4 : 3;      // Max fields (with delivery)
         
         const validCount = extractedData.filter(x => x !== null && x !== undefined).length;

         clearTimeout(silenceTimer.current);

         // CRITICAL FIX:
         // If we have the MAXIMUM number of fields (including delivery), execute immediately.
         // If we have the MINIMUM, WAIT (debounce) to give user time to say "and [delivery]".
         if (validCount >= maxLen) { 
             processCommand(extractedData, currentMode); 
         } else if (validCount >= requiredLen) {
             // We have enough to process, but user might be adding delivery charges.
             // Wait 2.5 seconds before processing.
             silenceTimer.current = setTimeout(() => processCommand(extractedData, currentMode), 2500); 
         } else {
             // Incomplete command, keep waiting/listening
             silenceTimer.current = setTimeout(() => processCommand(extractedData, currentMode), 4000); 
         }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    };

    const processCommand = (data?: any[], detectedMode?: string) => {
       if (hasExecutedRef.current) return;
       if (recognitionRef.current) recognitionRef.current.stop();
       
       const useMode = detectedMode || mode;

       if (data && data.length > 0) {
           hasExecutedRef.current = true;
           
           if (useMode === "credit") {
               // Expecting: [Address, Qty, Variant, Delivery]
               const addr = data[0]; 
               const qty = data[1]; 
               const vari = String(data[2]); 
               const del = data[3] || 0; 
               
               if (addr && qty && vari) {
                   onCommandRef.current(qty, vari, del, addr);
                   setDisplayTranscript("Done!");
               } else {
                   setDisplayTranscript("Incomplete Credit Cmd");
               }
           } else {
               // Expecting: [Qty, Variant, Delivery]
               const qty = data[0]; 
               const vari = String(data[1]); 
               const del = data[2] || 0; 
               
               if (qty && vari) {
                   onCommandRef.current(qty, vari, del);
                   setDisplayTranscript("Done!");
               } else {
                   setDisplayTranscript("Incomplete Cash Cmd");
               }
           }
       } else {
           setDisplayTranscript("No Command");
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