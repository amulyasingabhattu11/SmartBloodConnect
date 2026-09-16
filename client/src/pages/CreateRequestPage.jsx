import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../services/apiClient.js';
import { MedicalDisclaimer } from '../components/ui/MedicalDisclaimer.jsx';

export const CreateRequestPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    patient_reference: '',
    required_blood_group: 'B+',
    units_required: 2,
    urgency: 'CRITICAL',
    hospital_name: '',
    hospital_address: '',
    latitude: '17.4485',
    longitude: '78.3908',
    required_before: '',
    note: ''
  });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = { ...form, required_before: new Date(form.required_before).toISOString() };
      const res = await api.post('/requests', payload);
      navigate(`/app/requests/${res.data.request.request_id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h2>Create blood request</h2>
      <MedicalDisclaimer />
      {error && <div className="form-error">{error}</div>}
      <label>Patient/reference<input value={form.patient_reference} onChange={(e) => setForm({ ...form, patient_reference: e.target.value })} /></label>
      <label>Blood group<select value={form.required_blood_group} onChange={(e) => setForm({ ...form, required_blood_group: e.target.value })}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => <option key={g}>{g}</option>)}</select></label>
      <label>Units required<input type="number" min="1" value={form.units_required} onChange={(e) => setForm({ ...form, units_required: e.target.value })} /></label>
      <label>Urgency<select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}><option>NORMAL</option><option>URGENT</option><option>CRITICAL</option></select></label>
      <label>Hospital name<input value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} /></label>
      <label>Hospital address<input value={form.hospital_address} onChange={(e) => setForm({ ...form, hospital_address: e.target.value })} /></label>
      <label>Latitude<input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></label>
      <label>Longitude<input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></label>
      <label>Required before<input type="datetime-local" value={form.required_before} onChange={(e) => setForm({ ...form, required_before: e.target.value })} /></label>
      <label className="full">Note<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
      <button className="primary-button">Create and match donors</button>
    </form>
  );
};
