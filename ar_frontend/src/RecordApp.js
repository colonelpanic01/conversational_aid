import React, { useState, useEffect } from 'react';
import { convertAudioToPCM } from './utils/audioConversion';
import './App.css';

function RecordApp() {
  const [transcript, setTranscript] = useState('Waiting for conversation...');
  const [summary, setSummary] = useState('No summary yet');
  const [speaker, setSpeaker] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket = null;
    let mediaRecorder;

    const connectWebSocket = () => {
      socket = new WebSocket('ws://localhost:8000/ws');

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setTranscript('WebSocket connected. Requesting microphone access and waiting for audio...');
        
        // Request microphone access and stream audio
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            
            // // log when the recorder starts
            // mediaRecorder.onstart = () => {
            //   console.log("MediaRecorder started");
            // };
            // // log when recorder stops
            // mediaRecorder.onstop = () => {
            //   console.log("MediaRecorder stopped");
            // };

            mediaRecorder.ondataavailable = async (event) => {
              if (event.data.size > 0) {
                try {
                  const pcmData = await convertAudioToPCM(event.data);
                  
                  if (pcmData && socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(pcmData);
                    console.log("Audio chunk sent to WebSocket");
                  }
                } catch (error) {
                  console.error('Audio conversion error:', error);
                }
              }
            };
                        
            mediaRecorder.start(5000); // Send chunk every second
            console.log("MediaRecorder started recording");
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
          
          // Handle different message types
          if (data.status === 'connected') {
            setIsConnected(true);
          }
          setTranscript(data.transcription?.text || 'No transcript');
          setSummary(data.summary || 'No summary');
          setSpeaker(data.speaker || 'Unknown Speaker');
          
          if (data.transcription) {
            console.log('recieving transcript');
            //setTranscript(data.transcription?.text || 'No transcript');
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
        // Attempt to reconnect after 3 seconds
        // setTimeout(connectWebSocket, 3000);
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
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

export default RecordApp;