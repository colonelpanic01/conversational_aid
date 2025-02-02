export const setupAudioStream = ({ onConnectionUpdate, onTranscriptionUpdate }) => {
  let audioContext;
  let workletNode;
  let source;
  let stream;
  const socket = new WebSocket('ws://localhost:8000/ws');

  let audioBuffer = []; // Buffer to store chunks
  let bufferDuration = 0; // Track duration of buffered audio
  const chunkSizeMs = 128; // Assuming each chunk is ~128ms long (2048 samples / 16000 samples per second = ~128 ms per chunk)

  const updateConnectionStatus = (type, status) => {
    onConnectionUpdate(prev => ({ ...prev, [type]: status }));
  };

  socket.onopen = () => {
    updateConnectionStatus('websocket', true);
    setupAudioRecording();
  };

  socket.onclose = () => {
    updateConnectionStatus('websocket', false);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateConnectionStatus('websocket', false);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.status === 'success') {
        onTranscriptionUpdate({
          transcript: data.transcription?.text || 'No transcript available',
          speaker: data.speaker || 'Unknown Speaker',
          summary: data.summary || 'No summary available'
        });
      } else {
        console.error('Server error:', data.message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  const setupAudioRecording = async () => {
    try {
      // Get microphone stream
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      });
      
      updateConnectionStatus('microphone', true);
      
      // Create audio context
      audioContext = new AudioContext({
        sampleRate: 16000,
        latencyHint: 'interactive'
      });

      // Load and register the audio worklet
      await audioContext.audioWorklet.addModule('/src/audio-worklet.js');
      
      // Create worklet node
      workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      //////////////////////////////////////////////////////////////////////// 
      // Handle incoming audio data from worklet
      // workletNode.port.onmessage = (event) => {
      //   if (socket.readyState === WebSocket.OPEN) {
      //     const float32Array = event.data;
          
      //     // Convert to 16-bit PCM
      //     const pcmData = new Int16Array(float32Array.length);
      //     for (let i = 0; i < float32Array.length; i++) {
      //       const s = Math.max(-1, Math.min(1, float32Array[i]));
      //       pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      //     }
          
      //     socket.send(pcmData.buffer);
      //   }
      // };
      //////////////////////////////////////////////////////////////////////// 
      // Handle incoming audio data
      workletNode.port.onmessage = (event) => {
        const float32Array = event.data;

        // Convert to 16-bit PCM
        const pcmData = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Array[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Store data in buffer
        audioBuffer.push(...pcmData);
        bufferDuration += chunkSizeMs;

        // Send data every 2 seconds (2000 ms)
        if (bufferDuration >= 1000) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(new Int16Array(audioBuffer).buffer);
          }
          audioBuffer = []; // Clear buffer
          bufferDuration = 0; // Reset duration
        }
      };

      // Connect the audio graph
      source = audioContext.createMediaStreamSource(stream);
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      updateConnectionStatus('microphone', false);
    }
  };

  const cleanup = () => {
    if (workletNode) workletNode.disconnect();
    if (source) source.disconnect();
    if (audioContext) audioContext.close();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (socket.readyState === WebSocket.OPEN) socket.close();
  };

  return cleanup;
};