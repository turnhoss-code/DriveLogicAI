import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Bot, Loader2, Volume2, VolumeX, Minimize2 } from 'lucide-react';
import { processVoiceCommand } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

interface ChatAssistantProps {
  isMini?: boolean;
  onToggleMini?: () => void;
  onTabChange: (tab: 'obd' | 'damage' | 'gps' | 'maintenance' | 'fleet') => void;
  onSetNavigation: (from: string, to: string) => void;
  onDiagnose: () => Promise<string | void> | string | void;
  onMusicControl: (action: string) => void;
}

export interface ChatAssistantHandle {
  toggleMic: () => void;
  handleSend: (text: string) => void;
}

const ChatAssistant = forwardRef<ChatAssistantHandle, ChatAssistantProps>(({ isMini, onToggleMini, onTabChange, onSetNavigation, onDiagnose, onMusicControl }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I'm your ZTCD AI Assistant. How can I help you today?", sender: 'ai', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRecognitionRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    toggleMic: () => {
      startListening();
    },
    handleSend: (text: string) => {
      handleSend(text);
    }
  }));

  const speak = useCallback((text: string) => {
    if (isMuted || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    if (text.trim().toLowerCase() === "talk to me goose") {
      setInput('');
      startListening();
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const result = await processVoiceCommand(text);
    
    let diagnosisResult = "";

    if (result.functionCalls) {
      for (const call of result.functionCalls) {
        if (call.name === 'changeTab') {
          const args = call.args as { tab: 'obd' | 'damage' | 'gps' };
          onTabChange(args.tab);
        } else if (call.name === 'setNavigation') {
          const args = call.args as { from: string, to: string };
          onSetNavigation(args.from, args.to);
        } else if (call.name === 'diagnoseVehicle') {
          const diag = await onDiagnose();
          if (typeof diag === 'string') {
            diagnosisResult = diag;
          }
        } else if (call.name === 'controlMusic') {
          const args = call.args as { action: string };
          onMusicControl(args.action);
        }
      }
    }

    const finalMessageText = diagnosisResult || result.text || "Command executed successfully.";

    const aiMsg: Message = { 
      id: (Date.now() + 1).toString(), 
      text: finalMessageText, 
      sender: 'ai', 
      timestamp: Date.now() 
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
    speak(aiMsg.text);
  };

  const isStartingRef = useRef(false);

  const startListening = async () => {
    if (isStartingRef.current) return;
    
    if (isListening) {
      activeRecognitionRef.current?.stop();
      return;
    }

    isStartingRef.current = true;
    setMicError(null);

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setMicError("Mic blocked");
        isStartingRef.current = false;
        return;
      }
      // If it's a NotFoundError or other error, we log it but still try to start SpeechRecognition
      // which will handle its own errors gracefully.
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      isStartingRef.current = false;
    };
    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      isStartingRef.current = false;
      activeRecognitionRef.current = null;
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') {
        setIsListening(false);
        isListeningRef.current = false;
        isStartingRef.current = false;
        return;
      }
      console.error("Speech recognition error:", event.error);
      let errorMsg = "Mic error";
      if (event.error === 'not-allowed') errorMsg = "Mic/Browser blocked";
      if (event.error === 'network') errorMsg = "Network error";

      setMicError(errorMsg);
      setIsListening(false);
      isListeningRef.current = false;
      isStartingRef.current = false;
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };

    activeRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
      isListeningRef.current = false;
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      if (activeRecognitionRef.current) {
        try { activeRecognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full relative bg-[#151619]">
      {/* Header */}
      <div className="p-2 bg-car-accent/10 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 bg-car-accent/20 rounded-lg shrink-0">
            <Bot size={14} className="text-car-accent" />
          </div>
          {!isMini && <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 truncate">AI Co-Pilot</span>}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted) window.speechSynthesis.cancel();
            }} 
            className="p-1 hover:bg-white/10 rounded-lg text-white/40"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          {onToggleMini && (
            <button 
              onClick={onToggleMini} 
              className="p-1 hover:bg-white/10 rounded-lg text-white/40"
              title={isMini ? "Expand" : "Mini View"}
            >
              <Minimize2 size={12} className={cn(isMini && "rotate-180")} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {!isMini ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm",
                msg.sender === 'user' 
                  ? "bg-car-accent text-white rounded-tr-none" 
                  : "bg-white/5 text-white/80 border border-white/5 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                <Loader2 size={14} className="text-car-accent animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-2">
          {isLoading ? (
            <Loader2 size={16} className="text-car-accent animate-spin" />
          ) : (
            <div className="text-center">
              <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Last Msg</p>
              <p className="text-[10px] text-white/80 line-clamp-2 px-2">
                {messages[messages.length - 1]?.text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ChatAssistant;
