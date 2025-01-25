import 'regenerator-runtime/runtime';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Canvas } from '@react-three/fiber';
import { XR } from '@react-three/xr';
import { Text } from '@react-three/drei';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const App = () => {
  const videoRef = useRef(null);
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Start video stream
  useEffect(() => {
    const startVideo = () => {
      if (videoRef.current) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            console.log('Video stream started');
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          })
          .catch((err) => console.error('Error starting video: ', err));
      } else {
        console.error('Video reference is null');
      }
    };

    startVideo();
  }, []);

  // Detect faces
  useEffect(() => {
    const detectFaces = async () => {
      if (!loading && videoRef.current) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        console.log('Face detections:', detections); // Log face detections

        setFaces(
          detections.map((d) => ({
            x: d.box.x + d.box.width / 2,
            y: -d.box.y - d.box.height / 2,
            width: d.box.width,
            height: d.box.height,
          }))
        );
      }
    };

    const interval = setInterval(detectFaces, 100);
    return () => clearInterval(interval);
  }, [loading]);

  // Start speech recognition
  useEffect(() => {
    console.log('Speech recognition started');
    SpeechRecognition.startListening({ continuous: true });
  }, []);

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
        {/* Remove XR component if WebXR is not required */}
        {faces.map((face, index) => (
          <Text
            key={index}
            position={[face.x / 100 - 2, face.y / 100 + 2, 0]}
            color="white"
            fontSize={0.1}
            maxWidth={2}
          >
            {`Person ${index + 1}\nKey Info`}
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
        <p>{transcript}</p>
        <button onClick={resetTranscript}>Reset</button>
      </div>
    </div>
  );
};

export default App;
