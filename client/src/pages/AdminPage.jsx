import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { api, apiErrorMessage } from '../services/apiClient.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';

const locationFreshness = (capturedAt) => {
  if (!capturedAt) return { label: 'NOT CAPTURED', stale: true };
  const minutes = Math.max(0, Math.round((Date.now() - new Date(capturedAt).getTime()) / 60000));
  if (minutes < 5) return { label: 'LIVE < 5 MIN', stale: false };
  if (minutes < 60) return { label: `${minutes} MIN OLD`, stale: false };
  return { label: `${Math.round(minutes / 60)} H OLD`, stale: true };
};

export const AdminPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [stats, users, donors, requests] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/donors'), api.get('/admin/requests')
      ]);
      setData({ stats: stats.data.stats, users: users.data.users, donors: donors.data.donors, requests: requests.data.requests });
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }, []);

  useEffect(() => {
    load();
    const refreshTimer = window.setInterval(load, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [load]);

  const setUserStatus = async (userId, accountStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { account_status: accountStatus });
      await load();
    } catch (requestError) { setError(apiErrorMessage(requestError)); }
  };

  const setRequestStatus = async (requestId, status) => {
    try {
      await api.patch(`/admin/requests/${requestId}/status`, { status });
      await load();
    } catch (requestError) { setError(apiErrorMessage(requestError)); }
  };

  if (!data && !error) return <div className="panel">Loading admin dashboard...</div>;

  return (
    <div className="page-stack">
      {error && <div className="form-error">{error}</div>}
      <div className="panel-heading admin-heading">
        <div><h2>Operations overview</h2><p className="muted">Exact donor locations are restricted to administrators.</p></div>
        <button type="button" className="secondary-button" onClick={load}><RefreshCw size={17} /> Refresh</button>
      </div>
      {data && <>
        <section className="metric-grid">
          {Object.entries(data.stats).map(([key, value]) => <div className="metric" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}
        </section>
        <section className="panel">
          <h2>Donor live locations</h2>
          <p className="muted">This is each donor's last explicit GPS capture. Refresh stale locations before emergency dispatch.</p>
          <div className="table-list">
            {data.donors.length === 0 && <p className="muted">No donor profiles available.</p>}
            {data.donors.map((donor) => {
              const freshness = locationFreshness(donor.location_captured_at);
              return <div className="row-card admin-location-row" key={donor.donor_id}>
                <div><strong>{donor.name} · {donor.blood_group}</strong><span>{donor.phone} · {donor.location_label}</span></div>
                <div className="location-details">
                  <StatusBadge tone={freshness.stale ? 'warning' : 'success'}>{freshness.label}</StatusBadge>
                  <span>{Number(donor.latitude).toFixed(6)}, {Number(donor.longitude).toFixed(6)}</span>
                  <span>Accuracy: {donor.location_accuracy_m == null ? 'unknown' : `±${Math.round(donor.location_accuracy_m)} m`}</span>
                  <a className="secondary-button" href={`https://www.google.com/maps?q=${donor.latitude},${donor.longitude}`} target="_blank" rel="noreferrer"><MapPin size={17} /> Open map</a>
                </div>
              </div>;
            })}
          </div>
        </section>
        <section className="panel"><h2>Users</h2><div className="table-list">{data.users.map((user) => <div className="row-card" key={user.user_id}><div><strong>{user.name}</strong><span>{user.email} · {user.role}</span></div><div className="button-row"><StatusBadge>{user.account_status}</StatusBadge>{user.role !== 'ADMIN' && <button className={user.account_status === 'ACTIVE' ? 'danger-button' : 'secondary-button'} onClick={() => setUserStatus(user.user_id, user.account_status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}>{user.account_status === 'ACTIVE' ? 'Disable' : 'Enable'}</button>}</div></div>)}</div></section>
        <section className="panel"><h2>Requests</h2><div className="table-list">{data.requests.map((request) => <div className="row-card" key={request.request_id}><div><strong>{request.required_blood_group} - {request.hospital_name}</strong><span>{request.requester_name} · {request.units_required} units · {request.urgency}</span></div><div className="button-row"><StatusBadge>{request.status}</StatusBadge>{!['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(request.status) && <><button className="secondary-button" onClick={() => setRequestStatus(request.request_id, 'FULFILLED')}>Mark fulfilled</button><button className="danger-button" onClick={() => setRequestStatus(request.request_id, 'CANCELLED')}>Cancel</button></>}</div></div>)}</div></section>
      </>}
    </div>
  );
};
