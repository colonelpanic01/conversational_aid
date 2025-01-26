function App() {
    const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [speaker, setSpeaker] = useState('');
  
    useEffect(() => {
      const socket = new WebSocket('ws://localhost:8000/ws');
  
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setTranscript(data.transcription);
        setSummary(data.summary);
        setSpeaker(data.speaker);
      };
  
      return () => socket.close();
    }, []);
  
    return (
      <div>
        <div>Speaker: {speaker}</div>
        <div>Transcript: {transcript}</div>
        <div>Summary: {summary}</div>
      </div>
    );
  }