import speech_recognition as sr
from pyannote.audio import Pipeline
import io
import numpy as np
import webrtcvad

class AudioProcessor:
    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate
        self.recognizer = sr.Recognizer()
        
        # Voice Activity Detection
        self.vad = webrtcvad.Vad(3)  # Aggressive mode
        
        # Diarization pipeline
        self.diarization_pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization")

        # Audio buffer and state
        self.audio_buffer = bytearray()
        self.speakers = {}

    def is_speech(self, audio_chunk):
        """Determine if audio chunk contains speech"""
        try:
            # Convert to 16-bit PCM, single-channel, 16kHz
            return self.vad.is_speech(
                audio_chunk, 
                sample_rate=self.sample_rate
            )
        except Exception as e:
            print(f"VAD error: {e}")
            return False

    def process_audio_chunk(self, audio_data):
        try:
            # Log audio chunk details
            print(f"Audio Chunk Size: {len(audio_data)} bytes")
            print(f"First 10 bytes: {audio_data[:10]}")

            # Check if chunk contains speech
            if not self.is_speech(audio_data):
                return None

            # Convert audio chunk to AudioData
            audio_stream = io.BytesIO(audio_data)
            audio_segment = sr.AudioData(audio_stream.read(), self.sample_rate, 2)

            # Perform speech recognition
            text = self.recognizer.recognize_google(audio_segment)
            
            # Perform diarization
            diarization_result = self.diarization_pipeline(audio_data)
            
            # Extract speaker information
            for turn, _, speaker in diarization_result.itertracks(yield_label=True):
                if speaker not in self.speakers:
                    self.speakers[speaker] = ""
                self.speakers[speaker] += text + " "

            return {
                'text': text,
                'speaker': list(self.speakers.keys())[0] if self.speakers else 'Unknown'
            }

        except sr.UnknownValueError:
            print("No speech detected in chunk")
            return None
        except Exception as e:
            print(f"Audio processing error: {e}")
            return None

    def get_speaker_texts(self):
        return self.speakers

    def reset(self):
        self.audio_buffer.clear()
        self.speakers.clear()

