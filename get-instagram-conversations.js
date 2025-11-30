// Get Instagram conversations to find valid recipient IDs for testing
require('dotenv').config({ path: './frontend/.env.local' });

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_INSTAGRAM_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID;

console.log('═══════════════════════════════════════════════════════');
console.log('📱 Getting Instagram Conversations');
console.log('═══════════════════════════════════════════════════════\n');

async function getConversations() {
    if (!META_ACCESS_TOKEN || !META_INSTAGRAM_ACCOUNT_ID) {
        console.log('❌ Missing environment variables');
        console.log('   Make sure META_ACCESS_TOKEN and META_INSTAGRAM_ACCOUNT_ID are set\n');
        return;
    }

    console.log(`Instagram Account ID: ${META_INSTAGRAM_ACCOUNT_ID}\n`);

    try {
        // Get conversations
        const response = await fetch(
            `https://graph.facebook.com/v23.0/${META_INSTAGRAM_ACCOUNT_ID}/conversations?platform=instagram&fields=id,participants,updated_time,messages{message,from,created_time}&access_token=${META_ACCESS_TOKEN}`
        );

        if (!response.ok) {
            const error = await response.json();
            console.log('❌ Failed to get conversations');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${JSON.stringify(error, null, 2)}\n`);

            if (error.error?.code === 10) {
                console.log('💡 Permission Issue:');
                console.log('   Your access token needs instagram_manage_messages permission\n');
            }

            if (error.error?.code === 100) {
                console.log('💡 Possible Issues:');
                console.log('   - Instagram account ID is incorrect');
                console.log('   - No conversations exist yet');
                console.log('   - Token doesn\'t have access to this account\n');
            }

            return;
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            console.log('⚠️  No conversations found\n');
            console.log('To test Instagram messaging:');
            console.log('1. Have someone send a DM to your Instagram business account (@flexoraaaa)');
            console.log('2. Run this script again to get their Instagram Scoped ID (IGSID)');
            console.log('3. Use that IGSID in your test script\n');
            console.log('Note: You can only send messages to users who have messaged you first!\n');
            return;
        }

        console.log(`✅ Found ${data.data.length} conversation(s):\n`);

        data.data.forEach((conv, index) => {
            console.log(`Conversation ${index + 1}:`);
            console.log(`  ID: ${conv.id}`);
            console.log(`  Updated: ${new Date(conv.updated_time).toLocaleString()}`);

            if (conv.participants && conv.participants.data) {
                console.log(`  Participants:`);
                conv.participants.data.forEach(p => {
                    console.log(`    - ID: ${p.id} ${p.username ? `(@${p.username})` : ''}`);
                });
            }

            if (conv.messages && conv.messages.data && conv.messages.data.length > 0) {
                const lastMsg = conv.messages.data[0];
                console.log(`  Last Message: "${lastMsg.message?.substring(0, 50)}..."`);
                console.log(`  From: ${lastMsg.from?.id}`);
            }

            console.log('');
        });

        // Get a valid recipient ID
        if (data.data.length > 0 && data.data[0].participants?.data) {
            const participants = data.data[0].participants.data;
            const recipient = participants.find(p => p.id !== META_INSTAGRAM_ACCOUNT_ID);

            if (recipient) {
                console.log('═══════════════════════════════════════════════════════');
                console.log('✅ Valid Recipient ID for Testing:');
                console.log('═══════════════════════════════════════════════════════\n');
                console.log(`Recipient ID: ${recipient.id}`);
                if (recipient.username) {
                    console.log(`Username: @${recipient.username}`);
                }
                console.log('\nUpdate your test-meta-webhook.js:');
                console.log(`instagram: {`);
                console.log(`  to: '${recipient.id}',`);
                console.log(`},\n`);
            }
        }

    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }
}

getConversations();
