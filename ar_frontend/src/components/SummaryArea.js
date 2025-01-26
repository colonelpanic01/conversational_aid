import React from 'react';

function SummaryArea({ summary }) {
  return (
    <div className="summary-area">
      <h3>Conversation Summary</h3>
      <p>{summary}</p>
    </div>
  );
}

export default SummaryArea;