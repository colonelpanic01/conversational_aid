import React, { useState, useEffect } from 'react';
import { setupAudioStream } from './utils/audioUtils';
import './App.css';

const App = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    websocket: false,
    microphone: false
  });
  
  const [transcriptionData, setTranscriptionData] = useState({
    transcript: 'Waiting for conversation...',
    speaker: 'No speaker detected',
    summary: 'No summary available'
  });

  useEffect(() => {
    const cleanup = setupAudioStream({
      onConnectionUpdate: setConnectionStatus,
      onTranscriptionUpdate: setTranscriptionData
    });
    return cleanup;
  }, []);

  return (
    <div className="App">
      <div className="conversation-container">
        <div className="connection-status">
          Connection Status: {connectionStatus.websocket ? 'Connected ✅' : 'Disconnected ❌'}
        </div>
        <div className="speaker-info">
          <h2>{transcriptionData.speaker || 'No Speaker'}</h2>
        </div>
        <div className="transcript-area">
          <h3>Transcript</h3>
          <p>{transcriptionData.transcript}</p>
        </div>
        <div className="summary-area">
          <h3>Conversation Summary</h3>
          <p>{transcriptionData.summary}</p>
        </div>
      </div>
    </div>
  );
};

export default App;