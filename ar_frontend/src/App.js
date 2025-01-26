import React, { useState, useEffect } from 'react';
import TranscriptArea from './components/TranscriptArea';
import SummaryArea from './components/SummaryArea';
import { connectWebSocket } from './services/websocket';

function App() {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [speaker, setSpeaker] = useState('');

  useEffect(() => {
    const socket = connectWebSocket(
      (data) => {
        setTranscript(data.transcription);
        setSummary(data.summary);
        setSpeaker(data.speaker);
      }
    );

    return () => socket.close();
  }, []);

  return (
    <div className="App">
      <TranscriptArea transcript={transcript} speaker={speaker} />
      <SummaryArea summary={summary} />
    </div>
  );
}

export default App;