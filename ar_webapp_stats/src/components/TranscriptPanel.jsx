import React from 'react';
import { useTranscript } from '../contexts/TranscriptContext';
import { useFaceDetection } from '../contexts/FaceDetectionContext';

const TranscriptPanel = () => {
  const { 
    transcript, 
    resetTranscript, 
    listening,
    browserSupportsSpeechRecognition 
  } = useTranscript();
  
  const { 
    activeFaceIndex, 
    detectionParams, 
    setDetectionParams 
  } = useFaceDetection();

  if (!browserSupportsSpeechRecognition) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          color: 'red',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '5px'
        }}
      >
        Browser doesn't support speech recognition.
      </div>
    );
  }

  return (
    <div
      className="transcript"
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        paddingRight: '10px',
        borderRadius: '5px'
      }}
    >
      <h3>Live Transcript:</h3>
      <div style={{ color: listening ? 'lime' : 'yellow' }}>
        Status: {listening ? 'Listening' : 'Not Listening'}
      </div>
      {activeFaceIndex !== null ? (
        <p>{transcript}</p>
      ) : (
        <p>Waiting for a person to focus...</p>
      )}
      <button onClick={resetTranscript}>Reset</button>

      {/* Detection Parameter Adjustments */}
      <div>
        <label>
          Mouth Open Threshold:
          <input 
            type="range" 
            min="1" 
            max="20" 
            step="1"
            value={detectionParams.mouthOpenThreshold}
            onChange={(e) => setDetectionParams(prev => ({
              ...prev, 
              mouthOpenThreshold: parseFloat(e.target.value)
            }))}
          />
          {detectionParams.mouthOpenThreshold}
        </label>
      </div>
      <div>
        <label>
          Audio Level Threshold:
          <input 
            type="range" 
            min="0.01" 
            max="0.5" 
            step="0.01"
            value={detectionParams.audioLevelThreshold}
            onChange={(e) => setDetectionParams(prev => ({
              ...prev, 
              audioLevelThreshold: parseFloat(e.target.value)
            }))}
          />
          {detectionParams.audioLevelThreshold.toFixed(2)}
        </label>
      </div>
      <div>
        <label>
          Min Face Proximity:
          <input 
            type="range" 
            min="0.01" 
            max="0.7" 
            step="0.01"
            value={detectionParams.minFaceProximityRatio}
            onChange={(e) => setDetectionParams(prev => ({
              ...prev, 
              minFaceProximityRatio: parseFloat(e.target.value)
            }))}
          />
          {detectionParams.minFaceProximityRatio.toFixed(2)}
        </label>
      </div>
    </div>
  );
};

export default TranscriptPanel;