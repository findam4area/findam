/**
 * Paystack API Client
 * Handles payment initialization, verification, and webhook processing
 */

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned";
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

export interface PaystackInitializeParams {
  email: string;
  amount: number; // Amount in kobo (₦1 = 100 kobo)
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface PaystackTransferParams {
  source: string; // "balance"
  amount: number; // Amount in kobo
  recipient: string; // Recipient code from create recipient
  reason?: string;
  reference?: string;
}

export interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string;
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface PaystackCreateRecipientParams {
  type: "nuban"; // Nigerian bank account
  name: string;
  account_number: string;
  bank_code: string;
  currency: string; // "NGN"
}

export interface PaystackCreateRecipientResponse {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    recipient_code: string;
    type: string;
    updatedAt: string;
    is_deleted: boolean;
    details: {
      authorization_code: string | null;
      account_number: string;
      account_name: string | null;
      bank_code: string;
      bank_name: string;
    };
  };
}

class PaystackClient {
  private baseUrl = "https://api.paystack.co";
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Initialize a payment transaction
   */
  async initializeTransaction(
    params: PaystackInitializeParams,
  ): Promise<PaystackInitializeResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to initialize payment");
    }

    return response.json();
  }

  /**
   * Verify a payment transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to verify payment");
    }

    return response.json();
  }

  /**
   * Create a transfer recipient
   */
  async createRecipient(
    params: PaystackCreateRecipientParams,
  ): Promise<PaystackCreateRecipientResponse> {
    const response = await fetch(`${this.baseUrl}/transferrecipient`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create recipient");
    }

    return response.json();
  }

  /**
   * Initiate a transfer to a recipient
   */
  async initiateTransfer(
    params: PaystackTransferParams,
  ): Promise<PaystackTransferResponse> {
    const response = await fetch(`${this.baseUrl}/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to initiate transfer");
    }

    return response.json();
  }

  /**
   * Verify a transfer
   */
  async verifyTransfer(reference: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/transfer/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to verify transfer");
    }

    return response.json();
  }
}

// Export singleton instance
export const paystackClient = new PaystackClient(
  process.env.PAYSTACK_SECRET_KEY || "",
);
