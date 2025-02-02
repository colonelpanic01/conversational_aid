import whisper
from pyannote.audio.pipelines import SpeakerDiarization
import numpy as np
import torch
import os

from datetime import datetime, timezone, timedelta
from queue import Queue
from time import sleep

class AudioProcessor:
    def __init__(self, sample_rate=16000, frames_per_buffer=2048, phrase_timeout=3):
        # audio params
        self.sample_rate = sample_rate
        self.frames_per_buffer = frames_per_buffer
        
        self.phrase_time = None
        self.phrase_timeout = phrase_timeout
        
        # create temp directory if it doesn't exist
        os.makedirs("temp", exist_ok=True)
        
        # load models
        self.whisper_model = whisper.load_model("tiny")  # fastest model for live transcription
        self.pipeline = SpeakerDiarization.from_pretrained("pyannote/speaker-diarization")  # pyannote speaker diarization model

        self.buffer_size = sample_rate * 10  # keep last 10 seconds of audio
        # self.transcriptions = {}  # dictionary to store transcriptions per speaker
        self.transcriptions = []

        self.phrase_time = None  # Last time audio was processed
        self.data_queue = Queue()  # Audio queue


    def process_audio_chunk(self, audio_data):
        self.data_queue.put(audio_data)
        now = datetime.now(timezone.utc)
        if not self.data_queue.empty():
            phrase_complete = False
            if self.phrase_time and now - self.phrase_time > timedelta(seconds=self.phrase_timeout):
                phrase_complete = True
            
            self.phrase_time = now
            audio_data = b''.join(self.data_queue.queue)
            self.data_queue.queue.clear()

            # convert to whisper format
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

            # # transcribe
            # result = self.whisper_model.transcribe(audio_np, fp16=torch.cuda.is_available())
            # text = result['text'].strip()

            # if phrase_complete or not self.transcription:
            #     self.transcription.append(text)  # Start a new line if first input or after a pause
            # else:
            #     self.transcription[-1] += " " + text  # Append to the last line

            # return self.transcription



            # audio_np = np.array(audio_data, dtype=np.int16)
            # convert to PyTorch tensor for Pyannote (already normalized to -1 to 1)
            audio_tensor = torch.tensor(audio_np)
            audio_tensor = audio_tensor.unsqueeze(0)  # add batch dimension

            # perform speaker diarization to distinguish between the different speakers
            diarization = self.pipeline({"waveform": audio_tensor, "sample_rate": self.sample_rate})

            # transcriptions = []
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                start_idx = int(turn.start * self.sample_rate)
                end_idx = int(turn.end * self.sample_rate)

                if start_idx >= len(audio_np) or end_idx > len(audio_np):
                    continue

                segment_audio = audio_np[start_idx:end_idx]
                
                # # convert segment to float for whisper and then transcribe
                # segment_audio_float = segment_audio.astype(np.float32) / 32768.0
                
                transcription = self.whisper_model.transcribe(segment_audio, fp16=torch.cuda.is_available())
                transcription_text = transcription["text"].strip()

                if phrase_complete or not self.transcriptions:
                    self.transcriptions.append(f"Speaker {speaker}: {transcription}")
                else:
                    self.transcriptions[-1] += " " + transcription_text
            return self.transcriptions if self.transcriptions else ["No speech detected yet."]
