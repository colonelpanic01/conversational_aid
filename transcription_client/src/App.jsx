import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Mic, Wifi } from "lucide-react";
import { setupAudioStream } from './utils/audioUtils';

const App = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    websocket: false,
    microphone: false
  });
  
  const [transcriptionData, setTranscriptionData] = useState({
    transcript: 'Waiting for conversation...',
    speaker: 'No speaker detected',
    summary: 'No summary available'
  });

  useEffect(() => {
    const cleanup = setupAudioStream({
      onConnectionUpdate: setConnectionStatus,
      onTranscriptionUpdate: setTranscriptionData
    });
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Bar */}
        <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
          <div className="space-x-4">
            <Badge variant={connectionStatus.websocket ? "success" : "destructive"} className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              {connectionStatus.websocket ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant={connectionStatus.microphone ? "success" : "destructive"} className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              {connectionStatus.microphone ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Speaker Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Current Speaker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-blue-600">{transcriptionData.speaker}</p>
          </CardContent>
        </Card>

        {/* Transcript Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Live Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap">
              {transcriptionData.transcript}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Conversation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              {transcriptionData.summary}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default App;