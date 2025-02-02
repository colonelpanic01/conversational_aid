import whisper
from pyannote.audio.pipelines import SpeakerDiarization
from collections import deque
import numpy as np
import torch
import os
import wave


class AudioProcessor:
    def __init__(self, sample_rate=16000, frames_per_buffer=2048):
        # audio params
        self.sample_rate = sample_rate
        self.frames_per_buffer = frames_per_buffer
        
        # create temp directory if it doesn't exist
        os.makedirs("temp", exist_ok=True)
        
        # initialize models
        self.whisper_model = whisper.load_model("tiny")  # fastest model for live transcription
        self.pipeline = SpeakerDiarization.from_pretrained("pyannote/speaker-diarization")  # pyannote speaker diarization model

        self.buffer_size = sample_rate * 10  # keep last 10 seconds of audio
        self.transcriptions = {}  # dictionary to store transcriptions per speaker
    
    def save_audio_segment(self, audio_data, filename):
        # function just to test the quality of the WAV files, save raw audio data as a wav in temp directory
        filepath = os.path.join("temp", filename)
        with wave.open(filepath, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit PCM
            wf.setframerate(self.sample_rate)
            wf.writeframes(audio_data.tobytes())
        return filepath

    def process_audio_chunk(self, audio_data):
        audio_np = np.array(audio_data, dtype=np.int16)
        
        # Save audio snippet
        # filename = f"snippet_{np.random.randint(10000)}.wav"
        # snippet_path = self.save_audio_segment(audio_np, filename)

        # convert to PyTorch tensor for Pyannote (normalize to -1 to 1)
        audio_tensor = torch.tensor(audio_np, dtype=torch.float32) / 32768.0
        audio_tensor = audio_tensor.unsqueeze(0)  # add batch dimension

        # perform speaker diarization to distinguish between the different speakers
        diarization = self.pipeline({"waveform": audio_tensor, "sample_rate": self.sample_rate})

        transcriptions = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            start_idx = int(turn.start * self.sample_rate)
            end_idx = int(turn.end * self.sample_rate)

            if start_idx >= len(audio_np) or end_idx > len(audio_np):
                continue

            segment_audio = audio_np[start_idx:end_idx]
            
            # convert segment to float for whisper and then transcribe
            segment_audio_float = segment_audio.astype(np.float32) / 32768.0
            
            transcription = self.whisper_model.transcribe(segment_audio_float)["text"]
            transcriptions.append(f"Speaker {speaker}: {transcription} ({turn.start:.1f}s - {turn.end:.1f}s)")

        return transcriptions if transcriptions else ["No speech detected yet."]
