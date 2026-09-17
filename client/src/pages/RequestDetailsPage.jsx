import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/apiClient.js';
import { MedicalDisclaimer } from '../components/ui/MedicalDisclaimer.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export const RequestDetailsPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [contact, setContact] = useState(null);

  const load = () => api.get(`/requests/${id}`).then((res) => setData(res.data));
  useEffect(() => { load(); }, [id]);

  const notifyNext = async () => {
    try {
      await api.post(`/requests/${id}/notify-next-batch`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const setStatus = async (status) => {
    await api.patch(`/requests/${id}/status`, { status });
    await load();
  };

  const contactDonor = async (matchId) => {
    setError('');
    try {
      const res = await api.get(`/matches/${matchId}/contact`);
      setContact(res.data.contact);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  if (!data) return <div className="panel">Loading request...</div>;
  const { request, progress, matches } = data;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div><h2>{request.required_blood_group} - {request.hospital_name}</h2><p className="muted">{request.units_required} units required before {new Date(request.required_before).toLocaleString()}</p></div>
          <StatusBadge>{request.status}</StatusBadge>
        </div>
        <MedicalDisclaimer />
        {error && <div className="form-error">{error}</div>}
        {contact && (
          <div className="contact-panel">
            <strong>{contact.donor_label}: {contact.name}</strong>
            <span>Phone: {contact.phone}</span>
            <span>Email: {contact.email}</span>
            <span>Current address: {contact.current_address}</span>
            <p>{contact.note}</p>
          </div>
        )}
        <div className="metric-grid">
          <div className="metric"><span>Candidates</span><strong>{progress.candidates_identified}</strong></div>
          <div className="metric"><span>Notified</span><strong>{progress.notified}</strong></div>
          <div className="metric"><span>Accepted</span><strong>{progress.accepted}</strong></div>
          <div className="metric"><span>Declined</span><strong>{progress.declined}</strong></div>
        </div>
        <div className="button-row">
          <button className="primary-button" onClick={notifyNext}>Notify next batch</button>
          <button className="secondary-button" onClick={() => setStatus('FULFILLED')}>Close fulfilled</button>
          <button className="danger-button" onClick={() => setStatus('CANCELLED')}>Cancel request</button>
        </div>
      </section>
      <section className="panel">
        <h2>Candidate matches</h2>
        <div className="table-list">
          {matches.length === 0 && <p className="muted">No suitable candidates found yet.</p>}
          {matches.map((match) => (
            <div className="row-card" key={match.match_id}>
              <strong>{match.donor_label} - {match.blood_group}</strong>
              <span>{Number(match.distance_km).toFixed(1)} km approx. Candidate Priority Score: {match.priority_score}</span>
              <StatusBadge>{match.donor_response}</StatusBadge>
              <button
                className="secondary-button"
                onClick={() => contactDonor(match.match_id)}
                disabled={match.donor_response !== 'ACCEPTED'}
                title={match.donor_response === 'ACCEPTED' ? 'Show donor contact details' : 'Available after donor accepts'}
              >
                Contact donor
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
