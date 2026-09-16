import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, MapPin, ShieldCheck, UsersRound } from 'lucide-react';

export const LandingPage = () => (
  <main>
    <section className="hero">
      <div className="hero-inner">
        <p className="eyebrow">Ruby emergency matching</p>
        <h1>Find the right donor when every minute matters.</h1>
        <p>
          Ruby helps emergency blood requests reach suitable nearby potential donors quickly through location-aware matching.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="primary-button">Request Blood</Link>
          <Link to="/register" className="secondary-button">Become a Donor</Link>
        </div>
      </div>
    </section>
    <section className="feature-grid">
      <article><UsersRound /><h2>Emergency Matching</h2><p>Compatible, available candidates are filtered before alerts are sent.</p></article>
      <article><MapPin /><h2>Smart Radius</h2><p>Search expands from 5 km to 30 km when more candidates are needed.</p></article>
      <article><Activity /><h2>Priority Scoring</h2><p>Distance, recency, and response reliability are combined transparently.</p></article>
      <article><ShieldCheck /><h2>Privacy First</h2><p>Exact donor coordinates and private contact details stay protected.</p></article>
    </section>
  </main>
);
