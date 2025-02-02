import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useFaceDetection } from '../contexts/FaceDetectionContext';
import { useTranscript } from '../contexts/TranscriptContext';

const ARCanvas = () => {
  const { faces, activeFaceIndex } = useFaceDetection();
  const { speakerName, summaryPoints } = useTranscript();

  return (
    <Canvas style={{ position: 'absolute', width: '100%', height: '100%' }}>
      {faces.map((face, index) => (
        <group key={face.id}>
          {/* Speaker Label */}
          <Text
            position={[face.x / 100 - 2, -face.y / 100 + 2, 0]} // Fixed the y-coordinate
            color={index === activeFaceIndex ? 'lime' : 'white'}
            fontSize={0.2}
            maxWidth={3}
          >
            {index === activeFaceIndex ? 
              (speakerName || 'Unrecognized Speaker') : 
              `Person ${index + 1}`}
          </Text>
          
          {/* Summary Points Box (only for active speaker) */}
          {index === activeFaceIndex && summaryPoints.length > 0 && (
            <group position={[face.x / 100 + 1, -face.y / 100, 0]}> {/* Fixed the y-coordinate */}
              <Text
                color="white"
                fontSize={0.15}
                maxWidth={4}
                lineHeight={1.5}
                anchorX="left"
              >
                {summaryPoints.join('\n')}
              </Text>
            </group>
          )}
        </group>
      ))}
    </Canvas>
  );
};

export default ARCanvas;