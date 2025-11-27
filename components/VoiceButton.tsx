import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './UI';
import { cleanAddressString, parseNumberFromText } from '../utils';

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
      setIsListening(true); setDisplayTranscript("Listening..."); hasExecutedRef.current = false;
      if (!SpeechRecognition) { if(showToast) showToast("Voice Not Supported", "error"); return; }
      const recognition = new SpeechRecognition();
      recognition.continuous = false; recognition.interimResults = true; recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onerror = (e: any) => { if(e.error !== 'no-speech') { setIsListening(false); setDisplayTranscript("Error"); } else { setIsListening(false); setDisplayTranscript(""); } };
      recognition.onend = () => { setIsListening(false); };
      recognition.onresult = (e: any) => {
         let final = ""; for (let i = e.resultIndex; i < e.results.length; ++i) final += e.results[i][0].transcript;
         const cleaned = final.toLowerCase().replace(/&/g, "and").replace(/\+/g, "and").replace(/\s+/g, " ");
         setDisplayTranscript(final);
         const parts = cleaned.split("and");
         let extracted: any[] = [];
         if (mode === "credit") {
             if (parts.length > 0) {
                const rawAddr = parts[0].trim();
                const addr = cleanAddressString(rawAddr);
                const nums = parts.slice(1).map(p => parseNumberFromText(p)).filter(n => n !== null);
                if (nums.length > 0) extracted = [addr, ...nums];
             }
         } else {
             extracted = parts.map(p => parseNumberFromText(p)).filter(n => n !== null);
         }
         const requiredLen = mode === "credit" ? 3 : 2; 
         // Basic Debounce Logic
         if (extracted.length >= requiredLen) { clearTimeout(silenceTimer.current); processCommand(extracted); } 
         else { clearTimeout(silenceTimer.current); silenceTimer.current = setTimeout(() => processCommand(extracted), 3000); }
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
               const addr = data[0]; const qty = data[1]; const vari = String(data[2]); const del = data.length > 3 ? data[3] : 0;
               onCommandRef.current(qty, vari, del, addr);
           } else {
               const qty = data[0]; const vari = String(data[1]); const del = data.length > 2 ? data[2] : 0;
               onCommandRef.current(qty, vari, del);
           }
           setDisplayTranscript("Done!");
       } else {
           setDisplayTranscript("No Command");
       }
    };

    if (inline) {
         return (
            <div className="flex flex-col items-center justify-center relative">
                 {isListening && <div className="absolute -top-10 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap z-50">{displayTranscript}</div>}
                 
                 <button onClick={isListening ? ()=>processCommand() : startListening} className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${isListening ? "bg-green-500 animate-pulse" : "bg-red-600"}`}>
                    <Icon name={isListening?"mic":"mic-off"} size={26} className="text-white"/>
                 </button>
            </div>
         )
    }

    return (
      <div className="fixed z-[100] bottom-32 right-6 md:bottom-12 md:right-12 flex flex-col items-end gap-2 pointer-events-none">
        {isListening && <div className="bg-black/80 text-white px-3 py-1 rounded-xl text-xs font-mono animate-fade-in mb-2 pointer-events-auto border border-green-500/30">{displayTranscript}</div>}
        <button onClick={isListening ? ()=>processCommand() : startListening} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl pointer-events-auto ${isListening ? "bg-green-500 animate-pulse text-white" : "bg-red-500 text-white"}`}><Icon name={isListening?"mic":"mic-off"} size={32}/></button>
      </div>
    );
};