# conversational_aid

* Parse conversations in real time, providing a transcription and summarization of what the speaker in front of the camera is saying
  * ar_webapp_stats is a vite react project using speach recognition and it implements the Cohere API for name detection and conversation summarization. Make sure you create your own Cohere token and add it in a .env file in the root directory. 
    - cd ar_webapp_stats
    - npm install
    - npm run dev

  * In the other implementation, audio_processing (flask and fastapi backend) performs speaker diarization to distinguish different speakers and transcribes using whisper (still have yet to summarize key details about the person you're talking to). In the transcription_client, we provide speaker and transcription details and send audio chunks to the backend for processing. 
    **Start Audio Processing Server**
    - cd audio_processing
    - pip install -r requirements.txt
    - uvicorn main:app --reload --port 8000
    **Start Transcription Client Frontend**
    In another terminal
    - cd transcript_client
    - npm install
    - npm run dev
