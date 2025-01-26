import 'regenerator-runtime/runtime';
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { io } from 'socket.io-client';

const App = () => {
  const videoRef = useRef(null);
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFaceIndex, setActiveFaceIndex] = useState(null);
  const [summary, setSummary] = useState('');
  const [transcription, setTranscription] = useState('');
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Improved socket connection with CORS configuration
    socketRef.current = io('http://localhost:5000', {
      withCredentials: true,
      extraHeaders: {
        "my-custom-header": "abcd"
      }
    });

    // Handle updates from the backend
    socketRef.current.on('update_transcription', (data) => {
      setTranscription(data.transcription);
    });

    socketRef.current.on('update_summary', (data) => {
      setSummary(data.summary);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

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

        // Set up MediaRecorder for audio
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        // Send audio chunks to the backend
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socketRef.current) {
            socketRef.current.emit('audio_chunk', event.data);
          }
        };

        mediaRecorder.start(1000); // Send audio chunks every second
      } catch (err) {
        console.error('Error starting streams:', err);
      }
    };

    startStreams();
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
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

      {/* Live Transcription */}
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
        <p>{transcription || 'Waiting for transcription...'}</p>
        <h3>Summary:</h3>
        <p>{summary || 'No summary yet...'}</p>
      </div>
    </div>
  );
};

export default App;