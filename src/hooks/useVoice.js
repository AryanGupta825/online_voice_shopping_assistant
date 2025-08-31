// src/hooks/useVoice.js
import { useEffect, useState, useRef } from 'react';

export const useVoice = (language = 'en-US') => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported by your browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;
    
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech Recognition Error:', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]); // Re-run effect if language changes

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setError(null);
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setError('Failed to start listening. It might already be running.');
        setIsListening(false);
      }
    } else {
      setError('Speech recognition not initialized.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { transcript, isListening, startListening, stopListening, error };
};