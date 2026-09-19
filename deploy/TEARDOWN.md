# Teardown: SmartBloodConnect AWS Resources

Follow these steps **in order** after the hackathon is over (or whenever you want to stop costs).
Delete resources from the outside in: CloudFront first, then EC2, then supporting services.

Estimated time: 15–20 minutes.

---

## Step 1 — Delete the CloudFront distribution

1. Open **CloudFront → Distributions** in the AWS console (region is global).
2. Select the distribution, click **Disable**, and wait for the status to change to `Disabled` (≈ 5 minutes).
3. Once disabled, click **Delete**.

> Do this first so the public URL stops working immediately and there are no dangling origin references.

---

## Step 2 — Release the Elastic IP (if one was allocated)

1. Open **EC2 → Elastic IPs**.
2. Select the address.
3. Click **Actions → Disassociate Elastic IP address**, then **Release Elastic IP address**.

> Unallocated Elastic IPs accrue a small hourly charge; release before or at the same time as terminating the instance.

---

## Step 3 — Terminate the EC2 instance

1. Open **EC2 → Instances**.
2. Select the `ruby` instance.
3. Click **Instance state → Terminate instance**.
4. Confirm. The instance and its root volume are deleted. Confirm the EBS root volume is gone under **EC2 → Volumes** afterwards.

> The PostgreSQL Docker volume lives on the root EBS volume and is automatically deleted with it.

---

## Step 4 — Delete the Security Group

1. Open **EC2 → Security Groups**.
2. Select `ruby-sg`.
3. Click **Actions → Delete security groups**.

> You cannot delete a security group while it is attached to a running instance; do this after step 3.

---

## Step 5 — Delete the SNS topic

1. Open **SNS → Topics** in `ap-south-1`.
2. Select `ruby-donor-alerts`.
3. Click **Delete**. Confirm.

> All subscriptions on the topic are automatically deleted.

---

## Step 6 — Delete SSM Parameter Store parameters

1. Open **Systems Manager → Parameter Store** in `ap-south-1`.
2. Search for `/ruby/`.
3. Select all `/ruby/*` parameters:
   - `/ruby/JWT_SECRET`
   - `/ruby/DB_PASSWORD`
   - `/ruby/CLIENT_ORIGIN` (if stored)
   - `/ruby/SNS_TOPIC_ARN` (if stored)
4. Click **Delete**. Confirm.

---

## Step 7 — Delete the IAM role and instance profile

1. Open **IAM → Roles**.
2. Search for `ruby-ec2-role`.
3. Click the role → **Delete** (this also removes the instance profile automatically).

> Remove inline policies first if the console requires it.

---

## Step 8 — Cancel the AWS Budgets alert (optional)

1. Open **Billing → Budgets**.
2. Select your USD 5 budget.
3. Click **Actions → Delete**.

> This is optional if you want to keep the budget for future use, but clean it up to avoid confusion.

---

## Step 9 — Verify billing

1. Open **Billing → Bills** and confirm no unexpected charges from today.
2. Check **Cost Explorer** (may have a 24-hour delay) for any residual charges.
3. If anything looks wrong, open a support case immediately while costs are small.

---

## Quick-reference checklist

| Resource | Where | Done? |
|---|---|---|
| CloudFront distribution | CloudFront (global) | ☐ |
| Elastic IP | EC2 → Elastic IPs | ☐ |
| EC2 instance | EC2 → Instances | ☐ |
| EBS root volume | EC2 → Volumes (verify deleted) | ☐ |
| Security group `ruby-sg` | EC2 → Security Groups | ☐ |
| SNS topic `ruby-donor-alerts` | SNS → Topics (ap-south-1) | ☐ |
| SSM parameters `/ruby/*` | Systems Manager → Parameter Store (ap-south-1) | ☐ |
| IAM role `ruby-ec2-role` | IAM → Roles | ☐ |
| AWS Budget alert | Billing → Budgets | ☐ |
| Billing verified | Billing → Bills | ☐ |
