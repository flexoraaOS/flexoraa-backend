import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';

// Meta webhook verification token (set this in your Meta app settings)
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your_verify_token';

interface InstagramMessageData {
  messages?: Array<{
    from: string;
    text?: {
      body: string;
    };
    timestamp: string;
  }>;
}

interface WhatsAppMessageData {
  contacts?: Array<{
    profile?: {
      name: string;
    };
  }>;
  messages?: Array<{
    from: string;
    text?: {
      body: string;
    };
    timestamp: string;
  }>;
}

interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time?: number;
    messaging?: MessagingEvent[];
    changes?: Array<{
      field: string;
      value: InstagramMessageData | WhatsAppMessageData;
    }>;
  }>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Meta Webhook received:', JSON.stringify(body, null, 2));

    // Check if this is a page subscription
    if (body.object === 'page') {
      // Handle page events (Instagram, Facebook Messenger)
      for (const entry of body.entry) {
        const pageId = entry.id;
        const timeOfEvent = entry.time;

        // Handle messaging events
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await handleMessagingEvent(pageId, messagingEvent);
          }
        }

        // Handle Instagram events
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await handleInstagramMessage(pageId, change.value);
            }
          }
        }
      }
    }

    // Check if this is a WhatsApp webhook
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        const phoneNumberId = entry.id;

        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await handleWhatsAppMessage(phoneNumberId, change.value);
            }
          }
        }
      }
    }

    // Return a '200 OK' response to all requests
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Meta webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

interface MessagingEvent {
  message?: {
    text?: {
      body?: string;
    };
  };
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: string;
  postback?: any;
}

async function handleMessagingEvent(pageId: string, event: MessagingEvent) {
  try {
    // Find user by page ID
    const { data: credentials } = await supabase
      .from('credentials')
      .select('user_id')
      .eq('business_account_id', pageId)
      .single();

    if (!credentials) {
      console.log('No credentials found for page:', pageId);
      return;
    }

    const userId = credentials.user_id;

    // Handle different message types
    if (event.message) {
      const message = event.message;
      const senderId = event.sender.id;
      const recipientId = event.recipient.id;
      const messageText = message.text?.body || '';
      const timestamp = new Date(parseInt(event.timestamp));

      // Store message in contact_history table
      await supabase.from('contact_history').insert({
        user_id: userId,
        lead_id: senderId, // Using sender ID as lead identifier
        direction: 'inbound',
        message_text: messageText,
        message_type: 'facebook_messenger',
        sent_at: timestamp.toISOString()
      });

      // Check if lead exists, create if not
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('phone_number', senderId)
        .eq('user_id', userId)
        .single();

      if (!existingLead) {
        await supabase.from('leads').insert({
          user_id: userId,
          phone_number: senderId,
          status: 'pending',
          stage: 'new',
          has_whatsapp: false // This is Facebook Messenger
        });
      }

      // Trigger n8n workflow for AI processing
      await triggerN8nWorkflow('facebook_message', {
        userId,
        pageId,
        senderId,
        messageText,
        timestamp: timestamp.toISOString(),
        platform: 'facebook'
      });

    } else if (event.postback) {
      // Handle postback events (button clicks, etc.)
      console.log('Postback event:', event.postback);
    }

  } catch (error) {
    console.error('Error handling messaging event:', error);
  }
}

async function handleInstagramMessage(pageId: string, messageData: InstagramMessageData) {
  try {
    // Find user by page ID
    const { data: credentials } = await supabase
      .from('credentials')
      .select('user_id')
      .eq('business_account_id', pageId)
      .single();

    if (!credentials) {
      console.log('No credentials found for Instagram page:', pageId);
      return;
    }

    const userId = credentials.user_id;
    const message = messageData.messages?.[0];

    if (message) {
      const from = message.from;
      const messageText = message.text?.body || '';
      const timestamp = new Date(parseInt(message.timestamp));

      // Store message in contact_history table
      await supabase.from('contact_history').insert({
        user_id: userId,
        lead_id: from, // Using sender ID as lead identifier
        direction: 'inbound',
        message_text: messageText,
        message_type: 'instagram',
        sent_at: timestamp.toISOString()
      });

      // Check if lead exists, create if not
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('phone_number', from)
        .eq('user_id', userId)
        .single();

      if (!existingLead) {
        await supabase.from('leads').insert({
          user_id: userId,
          phone_number: from,
          status: 'pending',
          stage: 'new',
          has_whatsapp: false // This is Instagram
        });
      }

      // Trigger n8n workflow for AI processing
      await triggerN8nWorkflow('instagram_message', {
        userId,
        pageId,
        senderId: from,
        messageText,
        timestamp: timestamp.toISOString(),
        platform: 'instagram'
      });
    }

  } catch (error) {
    console.error('Error handling Instagram message:', error);
  }
}

async function handleWhatsAppMessage(phoneNumberId: string, messageData: WhatsAppMessageData) {
  try {
    // Find user by phone number ID
    const { data: credentials } = await supabase
      .from('credentials')
      .select('user_id')
      .eq('phone_number_id', phoneNumberId)
      .single();

    if (!credentials) {
      console.log('No credentials found for WhatsApp number:', phoneNumberId);
      return;
    }

    const userId = credentials.user_id;
    const contact = messageData.contacts?.[0];
    const message = messageData.messages?.[0];

    if (message && contact) {
      const from = message.from;
      const messageText = message.text?.body || '';
      const timestamp = new Date(parseInt(message.timestamp));
      const contactName = contact.profile?.name || '';

      // Store message in contact_history table
      await supabase.from('contact_history').insert({
        user_id: userId,
        lead_id: from, // Using phone number as lead identifier
        direction: 'inbound',
        message_text: messageText,
        message_type: 'whatsapp',
        sent_at: timestamp.toISOString()
      });

      // Check if lead exists, create or update
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
          name: contactName,
          status: 'pending',
          stage: 'new',
          has_whatsapp: true
        });
      } else if (!existingLead.name && contactName) {
        // Update name if not set
        await supabase
          .from('leads')
          .update({ name: contactName })
          .eq('id', existingLead.id);
      }

      // Trigger n8n workflow for AI processing
      await triggerN8nWorkflow('whatsapp_message', {
        userId,
        phoneNumberId,
        senderId: from,
        contactName,
        messageText,
        timestamp: timestamp.toISOString(),
        platform: 'whatsapp'
      });
    }

  } catch (error) {
    console.error('Error handling WhatsApp message:', error);
  }
}

interface N8nWorkflowPayload {
  userId: string;
  pageId?: string;
  phoneNumberId?: string;
  senderId: string;
  contactName?: string;
  messageText: string;
  timestamp: string;
  platform: string;
}

async function triggerN8nWorkflow(workflowType: string, payload: N8nWorkflowPayload) {
  try {
    const webhookUrl = process.env[`N8N_${workflowType.toUpperCase()}_WEBHOOK`];
    if (!webhookUrl) {
      console.log(`No webhook URL configured for ${workflowType}`);
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to trigger ${workflowType} workflow:`, response.status);
    } else {
      console.log(`Successfully triggered ${workflowType} workflow`);
    }
  } catch (error) {
    console.error(`Error triggering ${workflowType} workflow:`, error);
  }
}
