import 'regenerator-runtime/runtime';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useFaceDetection } from './FaceDetectionContext';
import { summarizeText, extractSpeakerName } from '../utils/cohereUtils';

const TranscriptContext = createContext();

export const useTranscript = () => useContext(TranscriptContext);

export const TranscriptProvider = ({ children }) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const [speakerName, setSpeakerName] = useState(null);
  const [summaryPoints, setSummaryPoints] = useState([]);
  const { activeFaceIndex } = useFaceDetection();
  
  // Add refs for managing API calls
  const lastSummarizedText = useRef('');
  const summarizeTimeoutRef = useRef(null);
  const lastApiCallTime = useRef(0);
  const MIN_TRANSCRIPT_LENGTH = 50;
  const MIN_TIME_BETWEEN_CALLS = 5000; // 5 seconds
  const DEBOUNCE_DELAY = 2000; // 2 seconds

  // Initialize speech recognition
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error('Browser does not support speech recognition.');
      return;
    }

    // Start speech recognition when there's an active face
    if (activeFaceIndex !== null && !listening) {
      SpeechRecognition.startListening({ continuous: true });
    } else if (activeFaceIndex === null && listening) {
      SpeechRecognition.stopListening();
    }

    return () => {
      if (listening) {
        SpeechRecognition.stopListening();
      }
    };
  }, [activeFaceIndex, listening, browserSupportsSpeechRecognition]);

  // Handle transcript updates and summarization
  useEffect(() => {
    const handleTranscriptUpdate = async () => {
      if (!transcript) return;

      // Check for speaker name - only when "my name is" pattern is detected
      if (transcript.toLowerCase().includes('my name is') && 
          (!speakerName || transcript.length - lastSummarizedText.current.length > 20)) {
        const detectedName = await extractSpeakerName(transcript);
        if (detectedName) {
          setSpeakerName(detectedName);
        }
      }

      // Debounce and throttle summary generation
      if (summarizeTimeoutRef.current) {
        clearTimeout(summarizeTimeoutRef.current);
      }

      summarizeTimeoutRef.current = setTimeout(async () => {
        const currentTime = Date.now();
        const timeElapsed = currentTime - lastApiCallTime.current;
        
        if (
          transcript.length > MIN_TRANSCRIPT_LENGTH &&
          timeElapsed > MIN_TIME_BETWEEN_CALLS &&
          Math.abs(transcript.length - lastSummarizedText.current.length) > 20
        ) {
          const summary = await summarizeText(transcript);
          setSummaryPoints(summary);
          lastSummarizedText.current = transcript;
          lastApiCallTime.current = Date.now();
        }
      }, DEBOUNCE_DELAY);
    };

    handleTranscriptUpdate();

    return () => {
      if (summarizeTimeoutRef.current) {
        clearTimeout(summarizeTimeoutRef.current);
      }
    };
  }, [transcript, speakerName]);

  const value = {
    transcript,
    resetTranscript,
    speakerName,
    setSpeakerName,
    summaryPoints,
    listening,
    browserSupportsSpeechRecognition
  };

  return (
    <TranscriptContext.Provider value={value}>
      {children}
    </TranscriptContext.Provider>
  );
};