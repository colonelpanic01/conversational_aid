import React, { useState, useEffect } from 'react';
import Recorder from 'recorder-js';
import './App.css';

function RecordApp() {
  const [transcript, setTranscript] = useState('Waiting for conversation...');
  const [summary, setSummary] = useState('No summary yet');
  const [speaker, setSpeaker] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  let audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let recorder = null;
  
  useEffect(() => {
    let socket = null;
    let stream = null;

    const connectWebSocket = () => {
      socket = new WebSocket('ws://localhost:8000/ws');

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setTranscript('WebSocket connected. Requesting microphone access and waiting for audio...');
        
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(userStream => {
            stream = userStream;
            recorder = new Recorder(audioContext);
            recorder.init(stream);
            startRecording(socket);
          })
          .catch(error => {
            console.error('Microphone access error:', error);
            setTranscript('Microphone access denied');
          });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          setTranscript(data.transcription?.text || 'No transcript');
          setSummary(data.summary || 'No summary');
          setSpeaker(data.speaker || 'Unknown Speaker');
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setIsConnected(false);
        setTranscript('WebSocket connection error');
      };

      socket.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();
    return () => {
      if (socket) socket.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startRecording = (socket) => {
    if (recorder) {
      setIsRecording(true);
      recorder.start();
      setInterval(async () => {
        if (!isRecording) return;
        const { blob } = await recorder.stop();
        recorder.start(); // Restart recording
        socket.send(blob);
        console.log('Audio chunk sent to WebSocket');
      }, 5000);
    }
  };

  return (
    <div className="App">
      <div className="conversation-container">
        <div className="connection-status">
          Connection Status: {isConnected ? 'Connected ✅' : 'Disconnected ❌'}
        </div>
        <div className="speaker-info">
          <h2>{speaker || 'No Speaker'}</h2>
        </div>
        <div className="transcript-area">
          <h3>Transcript</h3>
          <p>{transcript}</p>
        </div>
        <div className="summary-area">
          <h3>Conversation Summary</h3>
          <p>{summary}</p>
        </div>
      </div>
    </div>
  );
}

export default RecordApp;
