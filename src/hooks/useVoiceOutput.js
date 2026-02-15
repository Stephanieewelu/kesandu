import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

const useVoiceOutput = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const synthesisRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!synthesisRef.current) {
      setError('Text-to-speech not available');
      return;
    }

    try {
      synthesisRef.current.cancel();

      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.lang = options.lang || 'en-US';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        setError(event.error);
        setIsSpeaking(false);
      };

      synthesisRef.current.speak(utterance);
    } catch (err) {
      setError(err.message);
      console.error('Speech synthesis error:', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    error,
    speak,
    stop,
  };
};

export default useVoiceOutput;
