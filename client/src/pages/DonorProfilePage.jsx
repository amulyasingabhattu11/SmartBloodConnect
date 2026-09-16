import React, { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../services/apiClient.js';
import { MedicalDisclaimer } from '../components/ui/MedicalDisclaimer.jsx';

const initial = {
  blood_group: 'B+',
  latitude: '17.4485',
  longitude: '78.3908',
  location_label: 'Demo area',
  last_donation_date: '',
  availability_status: 'AVAILABLE'
};

export const DonorProfilePage = () => {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/donors/profile').then((res) => {
      if (res.data.profile) {
        setForm({ ...res.data.profile, last_donation_date: res.data.profile.last_donation_date?.slice(0, 10) || '' });
      }
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/donors/profile', { ...form, last_donation_date: form.last_donation_date || null });
      setMessage('Donor profile saved.');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h2>Donor profile</h2>
      <MedicalDisclaimer />
      {message && <div className="form-success">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <label>Blood group<select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => <option key={g}>{g}</option>)}</select></label>
      <label>Location label<input value={form.location_label} onChange={(e) => setForm({ ...form, location_label: e.target.value })} /></label>
      <label>Latitude<input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></label>
      <label>Longitude<input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></label>
      <label>Last donation date<input type="date" value={form.last_donation_date} onChange={(e) => setForm({ ...form, last_donation_date: e.target.value })} /></label>
      <label>Availability<select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })}><option>AVAILABLE</option><option>UNAVAILABLE</option><option>TEMP_DISABLED</option></select></label>
      <button className="primary-button">Save profile</button>
    </form>
  );
};
