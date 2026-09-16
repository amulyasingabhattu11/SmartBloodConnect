import React from 'react';

export const HowItWorksPage = () => (
  <main className="narrow-page">
    <h1>How Ruby Works</h1>
    <div className="timeline">
      {['Requester creates an emergency blood request', 'Ruby filters compatible and available donors', 'Smart Radius Expansion finds enough nearby candidates', 'Top candidates receive in-app alerts', 'Requester tracks accepted, declined, and pending responses'].map((item, index) => (
        <div className="timeline-row" key={item}><span>{index + 1}</span><p>{item}</p></div>
      ))}
    </div>
  </main>
);
