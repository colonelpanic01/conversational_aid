export function connectWebSocket(onMessage) {
    const socket = new WebSocket('ws://localhost:8000/ws');
  
    socket.onopen = () => {
      console.log('WebSocket Connected');
      
      // Request microphone access and stream audio
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new AudioContext();
          const mediaRecorder = new MediaRecorder(stream);
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              socket.send(event.data);
            }
          };
          
          mediaRecorder.start(1000); // Send chunk every second
        })
        .catch(error => console.error('Microphone access error:', error));
    };
  
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
  
    return socket;
  }