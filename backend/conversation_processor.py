import os
from datetime import datetime

class ConversationTracker:
    def __init__(self):
        self.transcripts = {}
        self.start_time = datetime.now()

    def identify_speaker(self, transcription):
        speaker_count = len(self.transcripts)
        return f"Speaker {speaker_count + 1}"

    def add_transcript(self, speaker, transcription):
        if speaker not in self.transcripts:
            self.transcripts[speaker] = []
        
        self.transcripts[speaker].append(transcription)

    def save_conversation(self):
        os.makedirs('conversations', exist_ok=True)
        
        filename = f"conversations/{self.start_time.strftime('%Y%m%d_%H%M%S')}.txt"
        
        with open(filename, 'w') as f:
            for speaker, transcripts in self.transcripts.items():
                f.write(f"{speaker}:\n")
                for transcript in transcripts:
                    f.write(f"- {transcript}\n")
        
        return filename