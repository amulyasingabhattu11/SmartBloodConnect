import React, { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../services/apiClient.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.get('/notifications').then((res) => setNotifications(res.data.notifications));
  useEffect(() => { load(); }, []);

  const respond = async (matchId, action) => {
    setError('');
    try {
      await api.post(`/matches/${matchId}/${action}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  if (!notifications) return <div className="panel">Loading notifications...</div>;
  return (
    <section className="panel">
      <h2>Notifications</h2>
      {error && <div className="form-error">{error}</div>}
      <div className="table-list">
        {notifications.length === 0 && <p className="muted">No notifications yet.</p>}
        {notifications.map((item) => (
          <div className="row-card" key={item.notification_id}>
            <strong>{item.title}</strong>
            <span>{item.message}</span>
            <StatusBadge>{item.status}</StatusBadge>
            {item.type === 'DONOR_EMERGENCY_REQUEST' && item.status === 'SENT' && (
              <div className="button-row">
                <button className="primary-button" onClick={() => respond(item.match_id, 'accept')}>Accept</button>
                <button className="secondary-button" onClick={() => respond(item.match_id, 'decline')}>Decline</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
