/**
 * alertService.js
 *
 * Publishes an Amazon SNS alert when a donor is notified of a blood request.
 * Design spec: section 3.3
 *
 * Contract:
 *   publishDonorAlert({ request, distanceKm }) → Promise<{ sent: boolean }>
 *
 * Safety rules (R4):
 *   - Never throws; SNS failure is logged and swallowed.
 *   - Makes no AWS calls when ALERTS_ENABLED !== 'true'.
 *   - Never includes donor coordinates, phone, email, or patient reference.
 *   - Message attributes enable per-subscriber filter policies.
 */

import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

// Lazy singleton — the client is created on the first call so that importing
// this module during tests (where ALERTS_ENABLED is false) never touches AWS.
let _snsClient = null;

const getSNSClient = () => {
  if (!_snsClient) {
    _snsClient = new SNSClient({ region: process.env.AWS_REGION || 'ap-south-1' });
  }
  return _snsClient;
};

/**
 * Publish a donor alert to the configured SNS topic.
 *
 * @param {{ request: object, distanceKm: number|string }} params
 * @returns {Promise<{ sent: boolean }>}
 */
export const publishDonorAlert = async ({ request, distanceKm }) => {
  // Guard 1: feature flag — skip entirely when not opted in.
  if (process.env.ALERTS_ENABLED !== 'true') {
    return { sent: false };
  }

  // Guard 2: topic must be configured.
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) {
    return { sent: false };
  }

  const bloodGroup = request.required_blood_group ?? 'Unknown';
  const hospital = request.hospital_name ?? 'a hospital';
  const urgency = request.urgency ?? 'STANDARD';
  const km = Number(distanceKm).toFixed(1);

  const message =
    `Ruby alert: ${bloodGroup} blood needed at ${hospital}, ` +
    `about ${km} km away. Urgency: ${urgency}. Open Ruby to respond.`;

  const subject = `Urgent blood request: ${bloodGroup}`;

  try {
    await getSNSClient().send(
      new PublishCommand({
        TopicArn: topicArn,
        Message: message,
        Subject: subject,
        // Filter-policy attributes so subscribers can opt in by blood group or urgency.
        MessageAttributes: {
          bloodGroup: {
            DataType: 'String',
            StringValue: bloodGroup
          },
          urgency: {
            DataType: 'String',
            StringValue: urgency
          }
        }
      })
    );
    return { sent: true };
  } catch (error) {
    // R4.4: SNS failure must never break the in-app notification flow.
    console.error('SNS alert failed:', error.message);
    return { sent: false };
  }
};
