import 'regenerator-runtime/runtime';
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const App = () => {
  const videoRef = useRef(null);
  const [faces, setFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkedInData, setLinkedInData] = useState(null);
  const [speakerName, setSpeakerName] = useState(null);
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

  // Detect "my name is" and fetch LinkedIn data
  useEffect(() => {
    const matchNamePattern = /my name is (.+?)(\.|$)/i;
    const match = transcript.match(matchNamePattern);
    if (match) {
      const name = match[1].trim();
      console.log(`Detected name: ${name}`);
      // fetchLinkedInProfile(name);
      resetTranscript();
    }
  }, [transcript]);

  // const fetchLinkedInProfile = async (name) => {
  //   try {
  //     const response = await axios.get(`/api/linkedin/search`, {
  //       params: { name },
  //     });
  //     setLinkedInData(response.data);
  //     console.log('LinkedIn data:', response.data);
  //   } catch (error) {
  //     console.error('Error fetching LinkedIn data:', error);
  //   }
  // };

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
            key={index}
            position={[face.x / 100 - 2, face.y / 100 + 2, 0]}
            color="white"
            fontSize={0.1}
            maxWidth={2}
          >
            {`Person ${index + 1}`}
          </Text>
        ))}
      </Canvas>

      {/* LinkedIn Data */}
      {linkedInData && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
          }}
        >
          <h3>LinkedIn Profile</h3>
          <p>Name: {linkedInData.name}</p>
          <p>Title: {linkedInData.title}</p>
          <p>Company: {linkedInData.company}</p>
        </div>
      )}

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
