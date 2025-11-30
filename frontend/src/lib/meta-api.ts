import { supabase } from '@/lib/api/supabase';

// Rate limiting configuration
const RATE_LIMITS = {
  whatsapp: { requests: 1000, windowMs: 24 * 60 * 60 * 1000 }, // 1000 requests per day
  instagram: { requests: 200, windowMs: 60 * 60 * 1000 }, // 200 requests per hour
  facebook: { requests: 200, windowMs: 60 * 60 * 1000 }, // 200 requests per hour
};

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface MessageData {
  userId: string;
  platform: 'whatsapp' | 'instagram' | 'facebook';
  to: string;
  message: string;
  messageType?: 'text' | 'image' | 'file';
}

export interface WebhookMessage {
  platform: 'whatsapp' | 'instagram' | 'facebook';
  from: string;
  message: string;
  timestamp: Date;
  userId: string;
  contactName?: string;
}

export class MetaAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public platform: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'MetaAPIError';
  }
}

/**
 * Check rate limit for a user and platform
 */
export function checkRateLimit(userId: string, platform: 'whatsapp' | 'instagram' | 'facebook'): boolean {
  const key = `${userId}:${platform}`;
  const now = Date.now();
  const limit = RATE_LIMITS[platform];

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // Reset or initialize rate limit
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.windowMs
    });
    return true;
  }

  if (current.count >= limit.requests) {
    return false; // Rate limit exceeded
  }

  current.count++;
  return true;
}

/**
 * Send message via appropriate Meta API
 */
export async function sendMessage(data: MessageData): Promise<{ messageId: string; status: string }> {
  const { userId, platform, to, message } = data;

  // Check rate limit
  if (!checkRateLimit(userId, platform)) {
    throw new MetaAPIError(
      `Rate limit exceeded for ${platform}`,
      429,
      platform,
      true
    );
  }

  try {
    let response;

    switch (platform) {
      case 'whatsapp':
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/messages/whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, userId }),
        });
        break;

      case 'instagram':
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/messages/instagram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, userId }),
        });
        break;

      case 'facebook':
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/messages/messenger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, userId }),
        });
        break;

      default:
        throw new MetaAPIError(`Unsupported platform: ${platform}`, 400, platform);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new MetaAPIError(
        errorData.error || 'Failed to send message',
        response.status,
        platform,
        response.status === 429 || response.status >= 500
      );
    }

    const result = await response.json();
    return {
      messageId: result.messageId,
      status: result.status || 'sent'
    };

  } catch (error) {
    if (error instanceof MetaAPIError) {
      throw error;
    }
    throw new MetaAPIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      platform,
      true
    );
  }
}

/**
 * Process incoming webhook message
 */
export async function processWebhookMessage(webhookData: WebhookMessage): Promise<void> {
  const { userId, platform, from, message, timestamp, contactName } = webhookData;

  try {
    // Store message in contact_history
    await supabase.from('contact_history').insert({
      user_id: userId,
      lead_id: from,
      direction: 'inbound',
      message_text: message,
      message_type: platform,
      sent_at: timestamp.toISOString()
    });

    // Check if lead exists, create if not
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, name')
      .eq('phone_number', from)
      .eq('user_id', userId)
      .single();

    if (!existingLead) {
      await supabase.from('leads').insert({
        user_id: userId,
        phone_number: from,
        name: contactName || null,
        status: 'pending',
        stage: 'new',
        has_whatsapp: platform === 'whatsapp'
      });
    } else if (!existingLead.name && contactName) {
      // Update name if not set
      await supabase
        .from('leads')
        .update({ name: contactName })
        .eq('id', existingLead.id);
    }

    // Trigger AI processing workflow
    await triggerAIWorkflow({
      userId,
      leadId: from,
      message,
      platform,
      timestamp
    });

  } catch (error) {
    console.error('Error processing webhook message:', error);
    throw error;
  }
}

/**
 * Trigger AI workflow for message processing
 */
async function triggerAIWorkflow(data: {
  userId: string;
  leadId: string;
  message: string;
  platform: string;
  timestamp: Date;
}): Promise<void> {
  try {
    const webhookUrl = process.env[`N8N_${data.platform.toUpperCase()}_WEBHOOK`];
    if (!webhookUrl) {
      console.log(`No AI webhook configured for ${data.platform}`);
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

  } catch (error) {
    console.error(`Error triggering AI workflow for ${data.platform}:`, error);
  }
}

/**
 * Validate Meta API credentials
 */
export async function validateCredentials(
  userId: string,
  platform: 'whatsapp' | 'instagram' | 'facebook'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data: credentials } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!credentials) {
      return { valid: false, error: 'No credentials found' };
    }

    // Basic validation - check if required fields are present
    switch (platform) {
      case 'whatsapp':
        if (!credentials.phone_number_id || !credentials.meta_access_token) {
          return { valid: false, error: 'Missing WhatsApp credentials' };
        }
        break;
      case 'instagram':
      case 'facebook':
        if (!credentials.business_account_id || !credentials.meta_access_token) {
          return { valid: false, error: 'Missing page credentials' };
        }
        break;
    }

    // TODO: Add actual API validation by making a test request
    // For now, just return valid if credentials exist
    return { valid: true };

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

/**
 * Get message history for a lead
 */
interface MessageHistoryItem {
  id: string;
  user_id: string;
  lead_id: string;
  direction: 'inbound' | 'outbound';
  message_text: string;
  message_type: string;
  sent_at: string;
}

export async function getMessageHistory(
  userId: string,
  leadId: string,
  limit: number = 50
): Promise<MessageHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('contact_history')
      .select('*')
      .eq('user_id', userId)
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching message history:', error);
    return [];
  }
}

/**
 * Clean up old rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up rate limits every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);
