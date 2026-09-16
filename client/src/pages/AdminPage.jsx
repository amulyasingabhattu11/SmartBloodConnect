import React, { useEffect, useState } from 'react';
import { api } from '../services/apiClient.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export const AdminPage = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/requests')]).then(([stats, users, requests]) =>
      setData({ stats: stats.data.stats, users: users.data.users, requests: requests.data.requests })
    );
  }, []);
  if (!data) return <div className="panel">Loading admin dashboard...</div>;
  return (
    <div className="page-stack">
      <section className="metric-grid">
        {Object.entries(data.stats).map(([key, value]) => <div className="metric" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}
      </section>
      <section className="panel"><h2>Users</h2><div className="table-list">{data.users.map((user) => <div className="row-card" key={user.user_id}><strong>{user.name}</strong><span>{user.email}</span><StatusBadge>{user.account_status}</StatusBadge></div>)}</div></section>
      <section className="panel"><h2>Requests</h2><div className="table-list">{data.requests.map((request) => <div className="row-card" key={request.request_id}><strong>{request.required_blood_group} - {request.hospital_name}</strong><span>{request.requester_name}</span><StatusBadge>{request.status}</StatusBadge></div>)}</div></section>
    </div>
  );
};
