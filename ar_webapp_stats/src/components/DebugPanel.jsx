import React from 'react';
import { useFaceDetection } from '../contexts/FaceDetectionContext';

const DebugPanel = () => {
  const { debugInfo } = useFaceDetection();

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '5px',
        maxWidth: '300px',
        maxHeight: '300px',
        overflow: 'auto'
      }}
    >
      <h3>Debug Info:</h3>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};

export default DebugPanel;