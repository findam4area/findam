import crypto from "crypto";

/**
 * Verify Paystack webhook signature
 * @param payload - Raw request body as string
 * @param signature - X-Paystack-Signature header value
 * @returns boolean indicating if signature is valid
 */
export function verifyPaystackSignature(
  payload: string,
  signature: string,
): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

/**
 * Paystack webhook event types
 */
export type PaystackWebhookEvent =
  | "charge.success"
  | "charge.failed"
  | "subscription.create"
  | "subscription.disable"
  | "subscription.not_renew";

/**
 * Paystack webhook payload structure
 */
export interface PaystackWebhookPayload {
  event: PaystackWebhookEvent;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
  };
}
