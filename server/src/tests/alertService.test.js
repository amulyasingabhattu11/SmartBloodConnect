/**
 * alertService.test.js
 *
 * Unit tests for publishDonorAlert.
 * Design spec: section 3.5 (R4.7, R9.1)
 *
 * The SNS client is mocked so no real AWS calls are made.
 * Tests verify:
 *   - disabled flag makes no client call
 *   - enabled flag publishes exactly once with the expected message and attributes
 *   - message contains no phone, email, or coordinates
 *   - client rejection is swallowed and returns { sent: false }
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock @aws-sdk/client-sns before importing alertService ────────────────────
// We replace SNSClient with a factory that returns a mock with a controllable
// `send` method. The mock is reset between tests.

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn(() => ({ send: mockSend })),
  PublishCommand: vi.fn((input) => input) // pass-through so we can inspect the input
}));

// Import AFTER the mock is registered.
import { publishDonorAlert } from '../services/alertService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeRequest = (overrides = {}) => ({
  request_id: 'req-001',
  required_blood_group: 'B+',
  hospital_name: 'HITEC City General Hospital',
  urgency: 'CRITICAL',
  latitude: 17.4401,     // These should NEVER appear in the SNS message (R4.3)
  longitude: 78.3489,
  requester_phone: '+910000000000',   // Must NOT appear in alert
  requester_email: 'requester@test.invalid', // Must NOT appear in alert
  ...overrides
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('publishDonorAlert', () => {
  beforeEach(() => {
    mockSend.mockReset();
    // Default: enabled with a valid topic ARN
    process.env.ALERTS_ENABLED = 'true';
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:ap-south-1:123456789012:ruby-donor-alerts';
    process.env.AWS_REGION = 'ap-south-1';
  });

  afterEach(() => {
    delete process.env.ALERTS_ENABLED;
    delete process.env.SNS_TOPIC_ARN;
    delete process.env.AWS_REGION;
  });

  // ── R4.5: disabled flag ───────────────────────────────────────────────────
  it('returns { sent: false } and makes no SNS call when ALERTS_ENABLED is not set', async () => {
    delete process.env.ALERTS_ENABLED;
    const result = await publishDonorAlert({ request: makeRequest(), distanceKm: 3.7 });
    expect(result).toEqual({ sent: false });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns { sent: false } and makes no SNS call when ALERTS_ENABLED is "false"', async () => {
    process.env.ALERTS_ENABLED = 'false';
    const result = await publishDonorAlert({ request: makeRequest(), distanceKm: 3.7 });
    expect(result).toEqual({ sent: false });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns { sent: false } and makes no SNS call when SNS_TOPIC_ARN is missing', async () => {
    delete process.env.SNS_TOPIC_ARN;
    const result = await publishDonorAlert({ request: makeRequest(), distanceKm: 3.7 });
    expect(result).toEqual({ sent: false });
    expect(mockSend).not.toHaveBeenCalled();
  });

  // ── R4.1 / R4.2: happy path ───────────────────────────────────────────────
  it('publishes exactly once when enabled and returns { sent: true }', async () => {
    mockSend.mockResolvedValueOnce({ MessageId: 'msg-abc' });
    const result = await publishDonorAlert({ request: makeRequest(), distanceKm: 4.2 });
    expect(result).toEqual({ sent: true });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('includes blood group, hospital, urgency, and distance in the message', async () => {
    mockSend.mockResolvedValueOnce({ MessageId: 'msg-xyz' });
    await publishDonorAlert({ request: makeRequest(), distanceKm: 6.0 });

    const publishInput = mockSend.mock.calls[0][0];
    expect(publishInput.Message).toContain('B+');
    expect(publishInput.Message).toContain('HITEC City General Hospital');
    expect(publishInput.Message).toContain('CRITICAL');
    expect(publishInput.Message).toContain('6.0');
  });

  it('sets Subject with the blood group', async () => {
    mockSend.mockResolvedValueOnce({ MessageId: 'msg-subj' });
    await publishDonorAlert({ request: makeRequest(), distanceKm: 2.5 });

    const publishInput = mockSend.mock.calls[0][0];
    expect(publishInput.Subject).toContain('B+');
  });

  // ── R4.6: message attributes ──────────────────────────────────────────────
  it('sets bloodGroup and urgency MessageAttributes for filter policies', async () => {
    mockSend.mockResolvedValueOnce({ MessageId: 'msg-attrs' });
    await publishDonorAlert({ request: makeRequest(), distanceKm: 5.0 });

    const publishInput = mockSend.mock.calls[0][0];
    expect(publishInput.MessageAttributes.bloodGroup).toMatchObject({
      DataType: 'String',
      StringValue: 'B+'
    });
    expect(publishInput.MessageAttributes.urgency).toMatchObject({
      DataType: 'String',
      StringValue: 'CRITICAL'
    });
  });

  // ── R4.3: no sensitive data in message ────────────────────────────────────
  it('does not include donor coordinates, phone, or email in the message', async () => {
    mockSend.mockResolvedValueOnce({ MessageId: 'msg-safe' });
    const request = makeRequest({
      donor_latitude: 17.4401,
      donor_longitude: 78.3489,
      donor_phone: '+910000000000',
      donor_email: 'donor@test.invalid'
    });
    await publishDonorAlert({ request, distanceKm: 3.0 });

    const publishInput = mockSend.mock.calls[0][0];
    const messageText = publishInput.Message + (publishInput.Subject || '');
    expect(messageText).not.toContain('17.4401');
    expect(messageText).not.toContain('78.3489');
    expect(messageText).not.toContain('+910000000000');
    expect(messageText).not.toContain('donor@test.invalid');
    expect(messageText).not.toContain('requester@test.invalid');
  });

  // ── R4.4: SNS failure is swallowed ────────────────────────────────────────
  it('returns { sent: false } and does not throw when SNS rejects', async () => {
    mockSend.mockRejectedValueOnce(new Error('SNS endpoint unreachable'));
    await expect(
      publishDonorAlert({ request: makeRequest(), distanceKm: 1.5 })
    ).resolves.toEqual({ sent: false });
  });

  it('logs an error message when SNS rejects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSend.mockRejectedValueOnce(new Error('AuthorizationError'));

    await publishDonorAlert({ request: makeRequest(), distanceKm: 1.5 });

    expect(consoleSpy).toHaveBeenCalledWith(
      'SNS alert failed:',
      'AuthorizationError'
    );
    consoleSpy.mockRestore();
  });
});
