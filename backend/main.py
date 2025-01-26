import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np

from speech_processing import AudioProcessor
from conversation_processor import ConversationTracker
from nlp_summary import generate_summary

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation_tracker = ConversationTracker()
audio_processor = AudioProcessor()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            
            # Process audio chunk
            transcription = audio_processor.process_audio_chunk(data)
            
            if transcription:
                # Identify speaker and track conversation
                speaker = conversation_tracker.identify_speaker(transcription)
                conversation_tracker.add_transcript(speaker, transcription)
                
                # Generate summary for second speaker
                if len(conversation_tracker.transcripts) > 1:
                    summary = generate_summary(conversation_tracker.transcripts[1])
                
                # Send update to client
                await websocket.send_json({
                    'transcription': transcription,
                    'speaker': speaker,
                    'summary': summary
                })
    
    except WebSocketDisconnect:
        conversation_tracker.save_conversation()
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)