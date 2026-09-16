import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/apiClient.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export const MyRequestsPage = () => {
  const [requests, setRequests] = useState(null);
  useEffect(() => { api.get('/requests').then((res) => setRequests(res.data.requests)); }, []);
  if (!requests) return <div className="panel">Loading requests...</div>;
  return (
    <section className="panel">
      <div className="panel-heading"><h2>My requests</h2><Link className="primary-button" to="/app/requests/new">New request</Link></div>
      <div className="table-list">
        {requests.length === 0 && <p className="muted">No blood requests created yet.</p>}
        {requests.map((request) => (
          <Link className="row-card" to={`/app/requests/${request.request_id}`} key={request.request_id}>
            <strong>{request.required_blood_group} - {request.hospital_name}</strong>
            <span>{request.candidate_count} candidates, {request.accepted_count} accepted</span>
            <StatusBadge>{request.status}</StatusBadge>
          </Link>
        ))}
      </div>
    </section>
  );
};
