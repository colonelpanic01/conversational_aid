export async function convertAudioToPCM(blob) {
  return new Promise((resolve, reject) => {
    // Create an audio context
    const audioContext = new AudioContext();
    
    // Create a file reader
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        // Convert to 16-bit mono at 16kHz
        const arrayBuffer = reader.result;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Downmix to mono if stereo
        const channelData = audioBuffer.numberOfChannels > 1
          ? audioBuffer.getChannelData(0)  // Use first channel
          : audioBuffer.getChannelData(0);
        
        // Create Int16 PCM data
        const int16Array = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
          const sample = channelData[i];
          int16Array[i] = sample < 0 
            ? sample * 0x8000 
            : sample * 0x7FFF;
        }
        
        resolve(int16Array.buffer);
      } catch (error) {
        console.error('Detailed conversion error:', {
          message: error.message,
          name: error.name,
          blob: blob,
          blobType: blob.type,
          blobSize: blob.size
        });
        reject(error);
      }
    };
    
    // Read as array buffer
    reader.readAsArrayBuffer(blob);
  });
}