import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [transcript, setTranscript] = useState('Waiting for conversation...');
  const [summary, setSummary] = useState('No summary yet');
  const [speaker, setSpeaker] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket = null;

    const connectWebSocket = () => {
      socket = new WebSocket('ws://localhost:8000/ws');

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setTranscript('WebSocket connected. Requesting microphone access and waiting for audio...');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          // Handle different message types
          if (data.status === 'connected') {
            setIsConnected(true);
          }
          
          if (data.transcription) {
            setTranscript(data.transcription?.text || 'No transcript');
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setIsConnected(false);
        setTranscript('WebSocket connection error');
      };

      socket.onclose = (event) => {
        console.log('WebSocket closed:', event);
        setIsConnected(false);
        // Attempt to reconnect
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
    };
  }, []);

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

export default App;