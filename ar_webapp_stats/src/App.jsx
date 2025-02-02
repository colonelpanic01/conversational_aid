import React from 'react';
import VideoFeed from './components/VideoFeed';
import ARCanvas from './components/ARCanvas';
import DebugPanel from './components/DebugPanel';
import TranscriptPanel from './components/TranscriptPanel';
import { FaceDetectionProvider } from './contexts/FaceDetectionContext';
import { TranscriptProvider } from './contexts/TranscriptContext';

const App = () => {
  return (
    <FaceDetectionProvider>
      <TranscriptProvider>
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
          <VideoFeed />
          <ARCanvas />
          <DebugPanel />
          <TranscriptPanel />
        </div>
      </TranscriptProvider>
    </FaceDetectionProvider>
  );
};

export default App;