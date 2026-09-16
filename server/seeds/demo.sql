TRUNCATE notifications, donor_matches, blood_inventory, blood_banks, blood_requests, donor_profiles, users RESTART IDENTITY CASCADE;

INSERT INTO users (user_id, name, email, phone, password_hash, role) VALUES
('10000000-0000-0000-0000-000000000001', 'Ruby Admin', 'admin@ruby.demo', '+910000000001', '$2a$12$hFQ8IrdwbZH4Dbig36JUAuH9FkxPk.6YDdVGWJ7QO2dON2qhVT1S2', 'ADMIN'),
('10000000-0000-0000-0000-000000000002', 'Asha Requester', 'asha@ruby.demo', '+910000000002', '$2a$12$hFQ8IrdwbZH4Dbig36JUAuH9FkxPk.6YDdVGWJ7QO2dON2qhVT1S2', 'USER'),
('10000000-0000-0000-0000-000000000003', 'Dev Donor', 'dev@ruby.demo', '+910000000003', '$2a$12$hFQ8IrdwbZH4Dbig36JUAuH9FkxPk.6YDdVGWJ7QO2dON2qhVT1S2', 'USER'),
('10000000-0000-0000-0000-000000000004', 'Mina Donor', 'mina@ruby.demo', '+910000000004', '$2a$12$hFQ8IrdwbZH4Dbig36JUAuH9FkxPk.6YDdVGWJ7QO2dON2qhVT1S2', 'USER'),
('10000000-0000-0000-0000-000000000005', 'Kabir Donor', 'kabir@ruby.demo', '+910000000005', '$2a$12$hFQ8IrdwbZH4Dbig36JUAuH9FkxPk.6YDdVGWJ7QO2dON2qhVT1S2', 'USER'),
('10000000-0000-0000-0000-000000000006', 'Sara Donor', 'sara@ruby.demo', '+910000000006', '$2a$12$hFQ8IrdwbZH4Dbig36JUAuH9FkxPk.6YDdVGWJ7QO2dON2qhVT1S2', 'USER'),
('10000000-0000-0000-0000-000000000007', 'Omar Donor', 'omar@ruby.demo', '+910000000007', '$2a$12$hFQ8IrdwbZH4Dbig36JUAuH9FkxPk.6YDdVGWJ7QO2dON2qhVT1S2', 'USER');

INSERT INTO donor_profiles (donor_id, user_id, blood_group, latitude, longitude, location_label, last_donation_date, availability_status, response_count, accept_count, decline_count) VALUES
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'B+', 17.444000, 78.377000, 'HITEC City demo area', now()::date - 140, 'AVAILABLE', 8, 6, 2),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'O+', 17.430000, 78.410000, 'Jubilee Hills demo area', now()::date - 100, 'AVAILABLE', 4, 3, 1),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'B-', 17.500000, 78.390000, 'Kukatpally demo area', now()::date - 200, 'AVAILABLE', 2, 1, 1),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'A+', 17.385000, 78.486700, 'Central demo area', now()::date - 180, 'UNAVAILABLE', 3, 2, 1),
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'O-', 17.520000, 78.450000, 'North demo area', now()::date - 400, 'AVAILABLE', 10, 7, 3);

INSERT INTO blood_requests (request_id, requester_id, patient_reference, required_blood_group, hospital_name, hospital_address, latitude, longitude, units_required, urgency, required_before, status, note) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Patient R-102', 'B+', 'Ruby Demo Hospital', 'Madhapur demo hospital zone', 17.448500, 78.390800, 2, 'CRITICAL', now() + interval '8 hours', 'MATCHING', 'Demo emergency request');

INSERT INTO blood_banks (blood_bank_id, name, address, latitude, longitude, phone, verified_status) VALUES
('40000000-0000-0000-0000-000000000001', 'DEMO Ruby City Blood Bank', 'Demo medical district', 17.440000, 78.395000, '+910000000101', 'DEMO'),
('40000000-0000-0000-0000-000000000002', 'DEMO Lifeline Blood Center', 'Demo central road', 17.410000, 78.450000, '+910000000102', 'DEMO');

INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available, last_updated) VALUES
('40000000-0000-0000-0000-000000000001', 'B+', 3, now() - interval '42 minutes'),
('40000000-0000-0000-0000-000000000001', 'O+', 5, now() - interval '1 hour'),
('40000000-0000-0000-0000-000000000002', 'B+', 0, now() - interval '3 hours'),
('40000000-0000-0000-0000-000000000002', 'O-', 1, now() - interval '2 hours');

