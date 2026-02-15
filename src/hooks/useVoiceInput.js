import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const lastResultIndexRef = useRef(0);
  const shouldBeListeningRef = useRef(false); // Track if user wants to keep listening
  const silenceTimeoutRef = useRef(null);

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
          // If user wants to keep listening, restart automatically
          if (shouldBeListeningRef.current) {
            console.log('Recognition ended but user still speaking, restarting...');
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          } else {
            setIsListening(false);
          }
        };
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript('');
      finalTranscriptRef.current = '';
      lastResultIndexRef.current = 0;
      shouldBeListeningRef.current = true;
      setIsListening(true);

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      shouldBeListeningRef.current = false;
      setIsListening(false);

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
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
