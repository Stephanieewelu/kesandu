import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const lastResultIndexRef = useRef(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; // Keep listening until user stops
        recognitionRef.current.interimResults = true;
        recognitionRef.current.language = 'en-US';
        recognitionRef.current.maxAlternatives = 1;
        recognitionRef.current.absoluteMaxDuration = 300000; // 5 minutes max

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognitionRef.current.onresult = (event) => {
          let interim = '';

          // Process all results since the last index
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              // Add final results to our final transcript
              finalTranscriptRef.current += transcriptPart + ' ';
            } else {
              // Accumulate interim results
              interim += transcriptPart;
            }
          }

          lastResultIndexRef.current = event.resultIndex;

          // Display final results + interim results
          const displayText = finalTranscriptRef.current + interim;
          setTranscript(displayText);
        };

        recognitionRef.current.onerror = (event) => {
          setError(event.error);
          console.error('Speech recognition error:', event.error);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript('');
      finalTranscriptRef.current = '';
      lastResultIndexRef.current = 0;
      recognitionRef.current.start();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
    lastResultIndexRef.current = 0;
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useVoiceInput;
