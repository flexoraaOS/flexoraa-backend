// Test Facebook Messenger Configuration
require('dotenv').config({ path: './frontend/.env.local' });

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const API_KEY = process.env.FLEXORAA_API_KEY;
const BASE_URL = 'http://localhost:3000';

console.log('═══════════════════════════════════════════════════════');
console.log('💬 Facebook Messenger Testing');
console.log('═══════════════════════════════════════════════════════\n');

async function getMessengerConversations() {
    console.log('1. Checking Messenger Conversations...\n');

    const pageToken = META_PAGE_ACCESS_TOKEN || META_ACCESS_TOKEN;

    if (!pageToken) {
        console.log('❌ No access token found\n');
        return null;
    }

    try {
        // First get the page ID
        const pageResponse = await fetch(
            `https://graph.facebook.com/v23.0/me?access_token=${pageToken}`
        );

        if (!pageResponse.ok) {
            console.log('⚠️  Could not get page info\n');
            return null;
        }

        const pageData = await pageResponse.json();
        const pageId = pageData.id;

        console.log(`✅ Page: ${pageData.name || 'Unknown'} (ID: ${pageId})\n`);

        // Get conversations
        const response = await fetch(
            `https://graph.facebook.com/v23.0/${pageId}/conversations?fields=id,participants,updated_time,messages{message,from}&access_token=${pageToken}`
        );

        if (!response.ok) {
            const error = await response.json();
            console.log('⚠️  Could not fetch conversations');
            console.log(`   Error: ${error.error?.message}\n`);
            return null;
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            console.log('⚠️  No conversations found\n');
            console.log('To test Messenger:');
            console.log('1. Have someone send a message to your Facebook Page');
            console.log('2. Run this script again\n');
            return null;
        }

        console.log(`✅ Found ${data.data.length} conversation(s):\n`);

        data.data.forEach((conv, index) => {
            console.log(`Conversation ${index + 1}:`);
            console.log(`  ID: ${conv.id}`);

            if (conv.participants && conv.participants.data) {
                conv.participants.data.forEach(p => {
                    console.log(`  Participant: ${p.id} ${p.name ? `(${p.name})` : ''}`);
                });
            }

            if (conv.messages && conv.messages.data && conv.messages.data.length > 0) {
                const lastMsg = conv.messages.data[0];
                console.log(`  Last Message: "${lastMsg.message?.substring(0, 50)}..."`);
            }

            console.log('');
        });

        // Get a valid recipient PSID
        if (data.data.length > 0 && data.data[0].participants?.data) {
            const participants = data.data[0].participants.data;
            const recipient = participants.find(p => p.id !== pageId);

            if (recipient) {
                console.log('═══════════════════════════════════════════════════════');
                console.log('✅ Valid Recipient PSID Found:');
                console.log('═══════════════════════════════════════════════════════\n');
                console.log(`PSID: ${recipient.id}`);
                if (recipient.name) {
                    console.log(`Name: ${recipient.name}`);
                }
                console.log('');

                return recipient.id;
            }
        }

        return null;
    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return null;
    }
}

async function testMessengerSending(recipientId) {
    console.log('2. Testing Messenger Message Sending...\n');

    const testData = {
        to: recipientId,
        message: 'Hello from Flexoraa! 🚀 This is a test Messenger message.',
        userId: 'test-user'
    };

    console.log(`Sending to PSID: ${recipientId}\n`);

    try {
        const response = await fetch(`${BASE_URL}/api/messages/messenger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
            body: JSON.stringify(testData),
        });

        console.log(`Status: ${response.status}`);
        const result = await response.json();
        console.log('Response:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ Messenger message sent successfully!');
            console.log(`   Message ID: ${result.messageId}\n`);
            return true;
        } else {
            console.log('\n❌ Messenger message failed:', result.error);
            if (result.details) {
                console.log(`   Details: ${result.details}\n`);
            }
            return false;
        }

    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
        return false;
    }
}

async function runTest() {
    if (!META_PAGE_ACCESS_TOKEN && !META_ACCESS_TOKEN) {
        console.log('❌ No access token found in .env.local');
        console.log('   Run: node get-page-access-token.js\n');
        return;
    }

    if (!API_KEY || API_KEY === 'your-api-key-here') {
        console.log('❌ FLEXORAA_API_KEY not configured\n');
        return;
    }

    const recipientId = await getMessengerConversations();

    if (recipientId) {
        await testMessengerSending(recipientId);

        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ Test Complete!');
        console.log('═══════════════════════════════════════════════════════\n');
    } else {
        console.log('═══════════════════════════════════════════════════════');
        console.log('⚠️  Cannot Test Yet');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('You need someone to message your Facebook Page first.');
        console.log('Once they do, run this script again.\n');
    }
}

runTest();
