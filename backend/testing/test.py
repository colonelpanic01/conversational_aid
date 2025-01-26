import os
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import speech_recognition as sr
from pyannote.audio import Pipeline
from transformers import pipeline
import io
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

# More permissive CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": "http://localhost:5173",
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True
    }
})

# Configure SocketIO with explicit CORS origins
socketio = SocketIO(app, cors_allowed_origins="http://localhost:5173", cors_credentials=True)

# Initialize Pyannote pipeline for speaker diarization
# export PYANNOTE_TOKEN=your_huggingface_token_here
DIARIZATION_PIPELINE = Pipeline.from_pretrained("pyannote/speaker-diarization", use_auth_token=os.getenv("PYANNOTE_TOKEN"))

# Initialize Transformers pipeline for NLP summarization
SUMMARIZATION_PIPELINE = pipeline("summarization")

# Initialize SpeechRecognition recognizer
recognizer = sr.Recognizer()

# Data to store real-time conversation
real_time_text = ""
speaker_2_text = ""
speaker_2_summary = ""

@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

@socketio.on('audio_chunk')
def handle_audio_chunk(audio_data):
    global real_time_text, speaker_2_text, speaker_2_summary
    try:
        # Convert audio chunk to AudioData
        audio_stream = io.BytesIO(audio_data)
        audio_segment = sr.AudioData(audio_stream.read(), 16000, 2)
        
        try:
            # Transcribe audio
            text = recognizer.recognize_google(audio_segment)
            real_time_text += text + " "

            # Perform diarization
            diarization_result = DIARIZATION_PIPELINE(audio_data)
            for turn, _, speaker in diarization_result.itertracks(yield_label=True):
                if speaker == "SPEAKER_01":
                    print(f"Speaker 1 said: {text}")
                elif speaker == "SPEAKER_02":
                    speaker_2_text += text + " "
                    print(f"Speaker 2 said: {text}")

                    # Summarize every 20 words
                    if len(speaker_2_text.split()) >= 20:
                        speaker_2_summary = SUMMARIZATION_PIPELINE(
                            speaker_2_text, 
                            max_length=50, 
                            min_length=20, 
                            do_sample=False
                        )[0]["summary_text"]
                        socketio.emit('update_summary', {"summary": speaker_2_summary})

            # Emit transcription
            socketio.emit('update_transcription', {"transcription": real_time_text})
        
        except sr.UnknownValueError:
            pass
    
    except Exception as e:
        print(f"Error processing audio chunk: {e}")

@app.route('/end', methods=['POST'])
def end_conversation():
    try:
        global speaker_2_summary
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"summary_{timestamp}.txt"
        with open(filename, "w") as file:
            file.write(speaker_2_summary)

        return jsonify({"message": "Conversation ended and summary saved", "filename": filename}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)