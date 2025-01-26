import asyncio
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np

from speech_processing import AudioProcessor
from conversation_processor import ConversationTracker
from nlp_summary import generate_summary

# explicit logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            # heartbeat to keep connection alive
            await websocket.send_json({
                'status': 'connected',
                'message': 'WebSocket is active'
            })
            await asyncio.sleep(5)  # Send heartbeat every 5 seconds

            data = await websocket.receive_bytes()
            
            # Process audio chunk
            transcription = audio_processor.process_audio_chunk(data)
            
            if transcription:
                # Identify speaker and track conversation
                speaker = conversation_tracker.identify_speaker(transcription)
                conversation_tracker.add_transcript(speaker, transcription)
                
                # Generate summary for second speaker
                summary = "No summary available"
                if len(conversation_tracker.transcripts) > 1:
                    try:
                        summary = generate_summary(conversation_tracker.transcripts[1])
                    except Exception as e:
                        print(f"Summary generation error: {e}")
                
                # Send update to client
                await websocket.send_json({
                    'transcription': transcription,
                    'speaker': speaker,
                    'summary': summary
                })
    
    except WebSocketDisconnect:
        print("WebSocket disconnected")
        conversation_tracker.save_conversation()
    except Exception as e:
        print(f"WebSocket error: {e}")
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)