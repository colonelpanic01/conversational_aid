import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const FaceDetectionContext = createContext();

export const useFaceDetection = () => useContext(FaceDetectionContext);

export const FaceDetectionProvider = ({ children }) => {
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const prevMouthLandmarksRef = useRef(null);
  
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFaceIndex, setActiveFaceIndex] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  
  const [detectionParams, setDetectionParams] = useState({
    mouthOpenThreshold: 3,
    audioLevelThreshold: 0.05,
    minFaceProximityRatio: 0.1
  });

  // Face detection loop
  useEffect(() => {
    const detectFaces = async () => {
      if (!loading && videoRef.current) {
        try {
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

            // Calculate mouth openness
            let mouthOpenness = 0;
            if (mouthLandmarks.length > 0) {
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
              y: box.y + box.height / 2,
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
            , faceScores[0]);

            setActiveFaceIndex(mostLikelySpeakingFace.index);
          } else {
            setActiveFaceIndex(null);
          }
        } catch (error) {
          console.error('Face detection error:', error);
        }
      }
    };

    const intervalId = setInterval(detectFaces, 200);
    return () => clearInterval(intervalId);
  }, [loading, detectionParams]);

  const value = {
    videoRef,
    audioContextRef,
    analyserRef,
    prevMouthLandmarksRef,
    faces,
    setFaces,
    loading,
    setLoading,
    activeFaceIndex,
    setActiveFaceIndex,
    debugInfo,
    setDebugInfo,
    detectionParams,
    setDetectionParams
  };

  return (
    <FaceDetectionContext.Provider value={value}>
      {children}
    </FaceDetectionContext.Provider>
  );
};