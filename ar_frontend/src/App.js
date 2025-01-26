import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [transcript, setTranscript] = useState('Waiting for conversation...');
  const [summary, setSummary] = useState('No summary yet');
  const [speaker, setSpeaker] = useState('');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws');

    socket.onopen = () => {
      console.log('WebSocket Connected');
      
      // Request microphone access and stream audio
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new AudioContext();
          const mediaRecorder = new MediaRecorder(stream);
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              socket.send(event.data);
            }
          };
          
          mediaRecorder.start(1000); // Send chunk every second
        })
        .catch(error => {
          console.error('Microphone access error:', error);
          setTranscript('Microphone access denied');
        });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTranscript(data.transcription?.text || 'No transcript');
        setSummary(data.summary || 'No summary');
        setSpeaker(data.speaker || 'Unknown Speaker');
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setTranscript('WebSocket connection error');
    };

    return () => socket.close();
  }, []);

  return (
    <div className="App">
      <div className="conversation-container">
        <div className="speaker-info">
          <h2>{speaker}</h2>
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

export default App;