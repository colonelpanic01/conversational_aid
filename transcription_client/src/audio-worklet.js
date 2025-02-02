class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.bufferSize = 2048;
      this.buffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (input.length > 0) {
        const inputChannel = input[0];
        
        // Fill our buffer
        for (let i = 0; i < inputChannel.length; i++) {
          this.buffer[this.bufferIndex] = inputChannel[i];
          this.bufferIndex++;
  
          // When buffer is full, send it to the main thread
          if (this.bufferIndex >= this.bufferSize) {
            this.port.postMessage(this.buffer.slice());
            this.bufferIndex = 0;
          }
        }
      }
      return true;
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);