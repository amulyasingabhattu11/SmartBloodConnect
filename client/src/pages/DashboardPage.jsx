import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/apiClient.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export const DashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/requests/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="panel">Loading dashboard...</div>;

  return (
    <div className="page-stack">
      <section className="metric-grid">
        <div className="metric"><span>Active Requests</span><strong>{data.stats.active_requests}</strong></div>
        <div className="metric"><span>Completed Requests</span><strong>{data.stats.completed_requests}</strong></div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Recent requests</h2>
          <Link className="secondary-button" to="/app/requests/new">Create request</Link>
        </div>
        <div className="table-list">
          {data.recent_requests.length === 0 && <p className="muted">No requests yet.</p>}
          {data.recent_requests.map((request) => (
            <Link to={`/app/requests/${request.request_id}`} className="row-card" key={request.request_id}>
              <strong>{request.required_blood_group} at {request.hospital_name}</strong>
              <span>{request.units_required} units</span>
              <StatusBadge>{request.status}</StatusBadge>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
