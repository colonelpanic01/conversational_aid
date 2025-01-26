import 'regenerator-runtime/runtime';
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const DetailsAR = () => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFaceIndex, setActiveFaceIndex] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  
  const { transcript, resetTranscript } = useSpeechRecognition();
  
  // detection parameters
  const [detectionParams, setDetectionParams] = useState({
    mouthOpenThreshold: 3,    // Lowered threshold
    audioLevelThreshold: 0.05, // Lowered threshold
    minFaceProximityRatio: 0.1 // Significantly lowered
  });

  // Refs for tracking
  const prevMouthLandmarksRef = useRef(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        console.log('Models loaded successfully');
        setLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  // Setup audio analysis
  useEffect(() => {
    const setupAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch (err) {
        console.error('Audio analysis setup error:', err);
      }
    };

    setupAudioAnalysis();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Start video stream
  useEffect(() => {
    const startVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error('Video stream error:', err);
      }
    };

    startVideoStream();
  }, []);

  // Comprehensive speech detection
  useEffect(() => {
    const detectSpeech = async () => {
      if (!loading && videoRef.current) {
        // Detect faces with landmarks
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        // Calculate audio level
        let audioLevel = 0;
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          audioLevel = dataArray.reduce((a, b) => a + b, 0) / bufferLength / 255;
        }

        // Process face detections
        const processedFaces = detections.map((detection, i) => {
          const box = detection.detection.box;
          const landmarks = detection.landmarks;

          // Get mouth landmarks
          const mouthLandmarks = landmarks.getMouth();

          // Calculate mouth openness (vertical distance between upper and lower lip)
          let mouthOpenness = 0;
          if (prevMouthLandmarksRef.current && mouthLandmarks.length > 0) {
            // Calculate vertical distance between corresponding mouth points
            const upperLip = mouthLandmarks.slice(0, mouthLandmarks.length / 2);
            const lowerLip = mouthLandmarks.slice(mouthLandmarks.length / 2);
            
            mouthOpenness = upperLip.reduce((acc, point, idx) => {
              return acc + Math.abs(point.y - lowerLip[idx].y);
            }, 0) / upperLip.length;
          }

          // Store current mouth landmarks for next comparison
          prevMouthLandmarksRef.current = mouthLandmarks;

          // Calculate face proximity ratio
          const canvasWidth = videoRef.current.videoWidth;
          const canvasHeight = videoRef.current.videoHeight;
          const faceProximityRatio = (box.width * box.height) / (canvasWidth * canvasHeight);

          return {
            id: i,
            x: box.x + box.width / 2,
            y: -box.y - box.height / 2,
            width: box.width,
            height: box.height,
            area: box.width * box.height,
            mouthOpenness,
            faceProximityRatio,
            audioLevel
          };
        });

        setFaces(processedFaces);

        // Debug logging
        const debugDetails = {
          totalFaces: processedFaces.length,
          faceDetails: processedFaces.map((face, index) => ({
            id: face.id,
            mouthOpenness: face.mouthOpenness,
            audioLevel: face.audioLevel,
            faceProximityRatio: face.faceProximityRatio,
            detectionScores: {
              mouthOpennessScore: face.mouthOpenness > detectionParams.mouthOpenThreshold,
              audioLevelScore: face.audioLevel > detectionParams.audioLevelThreshold,
              faceProximityScore: face.faceProximityRatio > detectionParams.minFaceProximityRatio
            }
          }))
        };
        setDebugInfo(debugDetails);

        // Determine active face
        if (processedFaces.length > 0) {
          // Find face with highest combined detection scores
          const faceScores = processedFaces.map((face, index) => {
            const mouthOpennessScore = face.mouthOpenness > detectionParams.mouthOpenThreshold ? 1 : 0;
            const audioLevelScore = face.audioLevel > detectionParams.audioLevelThreshold ? 1 : 0;
            const faceProximityScore = face.faceProximityRatio > detectionParams.minFaceProximityRatio ? 1 : 0;

            const speechConfidence = mouthOpennessScore + audioLevelScore + faceProximityScore;

            console.log(`Face ${index} - Confidence: ${speechConfidence}`, {
              mouthOpenness: face.mouthOpenness,
              audioLevel: face.audioLevel,
              faceProximityRatio: face.faceProximityRatio
            });

            return {
              index,
              speechConfidence
            };
          });

          // Sort faces by confidence and select the highest
          const mostLikelySpeakingFace = faceScores.reduce((max, current) => 
            current.speechConfidence > max.speechConfidence ? current : max
          );

          // Always set the first detected face if any are present
          setActiveFaceIndex(mostLikelySpeakingFace.index);
          
          // Start speech recognition
          SpeechRecognition.startListening({ continuous: true });
        } else {
          // No faces detected
          setActiveFaceIndex(null);
          SpeechRecognition.stopListening();
          resetTranscript();
        }
      }
    };

    const interval = setInterval(detectSpeech, 200);
    return () => clearInterval(interval);
  }, [loading, detectionParams]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Video feed */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* 3D Canvas for AR */}
      <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {faces.map((face, index) => (
          <Text
            key={face.id}
            position={[face.x / 100 - 2, face.y / 100 + 2, 0]}
            color={index === activeFaceIndex ? 'lime' : 'white'}
            fontSize={0.1}
            maxWidth={2}
          >
            {`Person ${index + 1}${index === activeFaceIndex ? ' (Active)' : ''}`}
          </Text>
        ))}
      </Canvas>

      {/* Debug Information */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '5px',
          maxWidth: '300px',
          maxHeight: '300px',
          overflow: 'auto'
        }}
      >
        <h3>Debug Info:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      {/* Speech transcript and controls */}
      <div
        className="transcript"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '5px'
        }}
      >
        <h3>Live Transcript:</h3>
        {activeFaceIndex !== null ? (
          <p>{transcript}</p>
        ) : (
          <p>Waiting for a person to focus...</p>
        )}
        <button onClick={resetTranscript}>Reset</button>

        {/* Detection Parameter Adjustments */}
        <div>
          <label>
            Mouth Open Threshold:
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1"
              value={detectionParams.mouthOpenThreshold}
              onChange={(e) => setDetectionParams(prev => ({
                ...prev, 
                mouthOpenThreshold: parseFloat(e.target.value)
              }))}
            />
            {detectionParams.mouthOpenThreshold}
          </label>
        </div>
        <div>
          <label>
            Audio Level Threshold:
            <input 
              type="range" 
              min="0.01" 
              max="0.5" 
              step="0.01"
              value={detectionParams.audioLevelThreshold}
              onChange={(e) => setDetectionParams(prev => ({
                ...prev, 
                audioLevelThreshold: parseFloat(e.target.value)
              }))}
            />
            {detectionParams.audioLevelThreshold.toFixed(2)}
          </label>
        </div>
        <div>
          <label>
            Min Face Proximity:
            <input 
              type="range" 
              min="0.01" 
              max="0.7" 
              step="0.01"
              value={detectionParams.minFaceProximityRatio}
              onChange={(e) => setDetectionParams(prev => ({
                ...prev, 
                minFaceProximityRatio: parseFloat(e.target.value)
              }))}
            />
            {detectionParams.minFaceProximityRatio.toFixed(2)}
          </label>
        </div>
      </div>
    </div>
  );
};

export default DetailsAR;