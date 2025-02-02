import React, { useState, useEffect } from 'react';
// import { convertAudioToPCM } from './utils/audioConversion';
import './App.css';

function RecordApp() {
  const [transcript, setTranscript] = useState('Waiting for conversation...');
  const [summary, setSummary] = useState('No summary yet');
  const [speaker, setSpeaker] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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
            // mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.start(1000); // Sends audio every 1 second
            console.log("MediaRecorder started recording");

            setIsRecording(true);
            // // Prepare to send audio chunks every 5 seconds
            // mediaRecorder.ondataavailable = (event) => {
            //   if (event.data.size > 0) {
            //     try {
            //       // Send the audio chunk to WebSocket every time data is available
            //       socket.send(event.data);
            //       console.log("Audio chunk sent to WebSocket");

            //       // Optionally, convert audio to PCM (if needed)
            //       // const pcmData = await convertAudioToPCM(event.data);
            //       // if (pcmData && socket.readyState === WebSocket.OPEN) {
            //       //   socket.send(pcmData);
            //       //   console.log("PCM Audio chunk sent to WebSocket");
            //       // }
            //     } catch (error) {
            //       console.error('Error sending audio chunk:', error);
            //     }
            //   }
            // };
            // setIsRecording(true);
          })
          .catch(error => {
            console.error('Microphone access error:', error);
            setTranscript('Microphone access denied');
          });
      };
      async function handleDataAvailable(event) {
        if(event.data && event.data.size > 0) {
            let blobBuffer = new Blob([event.data],{type:'video/webm'})
            let rawbuffer = await blobBuffer.arrayBuffer()
            let buffer = new Uint8Array(rawbuffer)
            socket.postMessage(buffer)
        }
      }

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
        // Reconnect after 3 seconds if needed
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close();
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        setIsRecording(false);
      }
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