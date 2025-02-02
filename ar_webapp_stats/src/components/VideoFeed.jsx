import React, { useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useFaceDetection } from '../contexts/FaceDetectionContext';

const VideoFeed = () => {
  const {
    videoRef,
    audioContextRef,
    analyserRef,
    setLoading,
  } = useFaceDetection();

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
  }, [setLoading]);

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
  }, [audioContextRef, analyserRef]);

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
  }, [videoRef]);

  return (
    <video
      ref={videoRef}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
};

export default VideoFeed;