import speech_recognition as sr
import numpy as np

class AudioProcessor:
    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate
        self.recognizer = sr.Recognizer()
        self.current_speaker = "Speaker 1"

    def process_audio_chunk(self, audio_data):
        try:
            # Convert numpy array to AudioData
            audio_segment = sr.AudioData(
                audio_data, 
                self.sample_rate, 
                2  # bytes per sample
            )
            
            # Perform speech recognition
            transcription = self.recognizer.recognize_google(audio_segment)
            
            # Toggle speaker
            self.current_speaker = "Speaker 2" if self.current_speaker == "Speaker 1" else "Speaker 1"
            
            return {
                'text': transcription,
                'speaker': self.current_speaker
            }
        
        except sr.UnknownValueError:
            return None
        except Exception as e:
            print(f"Error processing audio: {e}")
            return None