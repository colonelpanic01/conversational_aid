## ConvoFlow - A Real-Time Conversational Aid 
Parse conversations in real time, providing a transcription and summarization of what the speaker in front of a camera is saying, beside them.

ar_webapp_stats is a vite react project using speach recognition and face detection. It implements the Cohere API for name detection and conversation summarization and uses face-api.js for face detection and determining speaker confidence. Make sure you create your own Cohere token and add it in a .env file in the root directory.
**Start AR webapp**
  - cd ar_webapp_stats
  - npm install
  - npm run dev

In the other implementation, audio_processing (flask and fastapi backend) performs speaker diarization to distinguish different speakers and transcribes using whisper (still have yet to summarize key details about the person you're talking to). In the transcription_client, we provide speaker and transcription details and send audio chunks to the backend for processing. 

**Start Audio Processing Server**    
  - cd audio_processing
  - pip install -r requirements.txt
  - uvicorn main:app --reload --port 8000
      
**Start Transcription Client Frontend** (In another terminal)
  - cd transcript_client
  - npm install
  - npm run dev

## TO-DO
  - [ ] Add feature for prompt generation so the user can select a key point about the person they are talking to and get a question/ conversational "tips" about something specific speaker_2 mentioned.
  - [ ] Add feature to view historical conversations and key points. Store conversational data for each person and use facial recognition to display info from previous conversation beside them whenever you see them again.
  - [ ] Make Arduino AR glasses to display speaker info.
  - [ ] (Not quite sure if this is ethically sound) but if speaker permitting, use Linkedin API to search for the speaker's name as its detected and display key points from their profile beside their face. Or something like the Harvard AR glasses project where we reverse image search the speaker's face and filter based on geographic location to display online persona. It sounds super invasive and icky but I think its just something cool to build. 
  - [ ] Restructure for a more cohesive execution.
  - [ ] Fix latency issue in the flask backend (whisper transcription just takes too darn long, react speech recognition is perfect however).
  
