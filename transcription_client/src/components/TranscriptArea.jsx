import React from 'react';

function TranscriptArea({ transcript, speaker }) {
  return (
    <div className="transcript-area">
      <h3>{speaker}</h3>
      <p>{transcript}</p>
    </div>
  );
}

export default TranscriptArea;