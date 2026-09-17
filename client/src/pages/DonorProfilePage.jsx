import React, { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../services/apiClient.js';
import { MedicalDisclaimer } from '../components/ui/MedicalDisclaimer.jsx';

const initial = {
  blood_group: 'B+',
  latitude: '',
  longitude: '',
  location_label: '',
  location_accuracy_m: null,
  location_captured_at: null,
  last_donation_date: '',
  availability_status: 'AVAILABLE'
};

export const DonorProfilePage = () => {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

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
      if (!form.location_captured_at) {
        setError('Capture your current live location before saving the donor profile.');
        return;
      }
      await api.post('/donors/profile', { ...form, last_donation_date: form.last_donation_date || null });
      setMessage('Donor profile saved.');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const useLiveLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Live location is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          location_accuracy_m: Number(position.coords.accuracy.toFixed(2)),
          location_captured_at: new Date(position.timestamp).toISOString()
        }));
        setMessage('Exact live coordinates captured. Enter the readable current address below.');
        setLocationLoading(false);
      },
      () => {
        setError('Could not access live location. Please allow location permission in the browser.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h2>Donor profile</h2>
      <MedicalDisclaimer />
      {message && <div className="form-success">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <label>Blood group<select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => <option key={g}>{g}</option>)}</select></label>
      <div className="full inline-action">
        <button type="button" className="secondary-button" onClick={useLiveLocation} disabled={locationLoading}>
          {locationLoading ? 'Capturing location...' : 'Use exact live location'}
        </button>
        <span className="muted">Distance and radius matching use these exact coordinates.</span>
      </div>
      <label className="full">Current address<input value={form.location_label} onChange={(e) => setForm({ ...form, location_label: e.target.value })} placeholder="House/area/street or current readable address" /></label>
      <label>Exact live latitude<input value={form.latitude} readOnly /></label>
      <label>Exact live longitude<input value={form.longitude} readOnly /></label>
      {form.location_captured_at && <p className="full muted">Captured {new Date(form.location_captured_at).toLocaleString()} with approximately {Math.round(form.location_accuracy_m || 0)} m accuracy.</p>}
      <label>Last donation date<input type="date" value={form.last_donation_date} onChange={(e) => setForm({ ...form, last_donation_date: e.target.value })} /></label>
      <label>Availability<select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })}><option>AVAILABLE</option><option>UNAVAILABLE</option><option>TEMP_DISABLED</option></select></label>
      <button className="primary-button">Save profile</button>
    </form>
  );
};
