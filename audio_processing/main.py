from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from speech_processing import AudioProcessor

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

audio_processor = AudioProcessor()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # get the audio chunk
            audio_data = await websocket.receive_bytes()
            
            # convert bytes to numpy array, ensuring proper shape
            try:
                # ensure the buffer is properly aligned for 16 bit integers
                if len(audio_data) % 2 != 0:
                    audio_data = audio_data[:-1]
                
                audio_np = np.frombuffer(audio_data, dtype=np.int16)
                
                # process audio chunk
                results = audio_processor.process_audio_chunk(audio_np)
                
                # send results back to client
                response = {
                    'status': 'success',
                    'transcription': {
                        'text': results[0] if results else 'No transcription available'
                    },
                    'speaker': results[0].split(':')[0] if results and ':' in results[0] else 'Unknown Speaker',
                    'summary': ' '.join(results) if results else 'No summary available'
                }
                
                await websocket.send_json(response)
                
            except Exception as e:
                print(f"Error processing audio chunk: {e}")
                await websocket.send_json({
                    'status': 'error',
                    'message': f"Error processing audio: {str(e)}"
                })
                
    except Exception as e:
        print(f"WebSocket connection error: {e}")
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)