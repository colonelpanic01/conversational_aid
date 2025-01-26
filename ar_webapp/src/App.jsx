import 'regenerator-runtime/runtime';
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const App = () => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFaceIndex, setActiveFaceIndex] = useState(null);
  const { transcript, resetTranscript } = useSpeechRecognition();

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading models...');
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

  // Start video and audio stream
  useEffect(() => {
    const startStreams = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Streams started');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error starting streams:', err);
      }
    };

    startStreams();
  }, []);

  // Detect faces
  useEffect(() => {
    const detectFaces = async () => {
      if (!loading && videoRef.current) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        setFaces(
          detections.map((d, i) => ({
            id: i,
            x: d.box.x + d.box.width / 2,
            y: -d.box.y - d.box.height / 2,
            width: d.box.width,
            height: d.box.height,
            area: d.box.width * d.box.height,
          }))
        );

        // Update the active face index to the largest (closest) face
        if (detections.length > 0) {
          const largestFaceIndex = detections.reduce(
            (largestIndex, currentFace, index, arr) =>
              currentFace.box.width * currentFace.box.height >
              arr[largestIndex].box.width * arr[largestIndex].box.height
                ? index
                : largestIndex,
            0
          );
          setActiveFaceIndex(largestFaceIndex);
        } else {
          setActiveFaceIndex(null);
        }
      }
    };

    const interval = setInterval(detectFaces, 100);
    return () => clearInterval(interval);
  }, [loading]);

  // Start speech recognition with filtering
  useEffect(() => {
    const startSpeechRecognition = async () => {
      if (activeFaceIndex !== null) {
        console.log('Speech recognition started for active face');
        SpeechRecognition.startListening({ continuous: true });
      } else {
        //SpeechRecognition.stopListening();
      }
    };

    startSpeechRecognition();
  }, [activeFaceIndex]);

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

      {/* Audio stream */}
      <audio ref={audioRef} style={{ display: 'none' }} />

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

      {/* Speech transcript */}
      <div
        className="transcript"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          color: 'white',
        }}
      >
        <h3>Live Transcript:</h3>
        {activeFaceIndex !== null ? (
          <p>{transcript}</p>
        ) : (
          <p>Waiting for a person to focus...</p>
        )}
        <button onClick={resetTranscript}>Reset</button>
      </div>
    </div>
  );
};

export default App;
