// Test Instagram API Configuration
// This script helps diagnose Instagram messaging issues

require('dotenv').config({ path: './frontend/.env.local' });

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_BUSINESS_ACCOUNT_ID = process.env.META_BUSINESS_ACCOUNT_ID;

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 Instagram API Configuration Diagnostic');
console.log('═══════════════════════════════════════════════════════\n');

// Check environment variables
console.log('1. Checking Environment Variables...\n');
console.log(`   META_ACCESS_TOKEN: ${META_ACCESS_TOKEN ? '✅ Set (' + META_ACCESS_TOKEN.substring(0, 20) + '...)' : '❌ Missing'}`);
console.log(`   META_BUSINESS_ACCOUNT_ID: ${META_BUSINESS_ACCOUNT_ID ? '✅ Set (' + META_BUSINESS_ACCOUNT_ID + ')' : '❌ Missing'}\n`);

if (!META_ACCESS_TOKEN || !META_BUSINESS_ACCOUNT_ID) {
    console.log('❌ Missing required environment variables!');
    console.log('   Please set META_ACCESS_TOKEN and META_BUSINESS_ACCOUNT_ID in frontend/.env.local\n');
    process.exit(1);
}

async function checkInstagramAccount() {
    console.log('2. Verifying Instagram Business Account...\n');

    try {
        const response = await fetch(
            `https://graph.facebook.com/v23.0/${META_BUSINESS_ACCOUNT_ID}?fields=id,username,name,profile_picture_url,followers_count&access_token=${META_ACCESS_TOKEN}`
        );

        if (!response.ok) {
            const error = await response.json();
            console.log('❌ Failed to fetch Instagram account info');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${JSON.stringify(error, null, 2)}\n`);

            if (response.status === 400) {
                console.log('💡 Possible Issues:');
                console.log('   - META_BUSINESS_ACCOUNT_ID is incorrect');
                console.log('   - This is not an Instagram Business Account ID');
                console.log('   - The ID might be a Facebook Page ID instead\n');
            }

            if (response.status === 190 || error.error?.code === 190) {
                console.log('💡 Access Token Issue:');
                console.log('   - Token is invalid or expired');
                console.log('   - Token doesn\'t have required permissions');
                console.log('   - Need to regenerate token with instagram_basic, instagram_manage_messages permissions\n');
            }

            return false;
        }

        const data = await response.json();
        console.log('✅ Instagram Account Found!');
        console.log(`   ID: ${data.id}`);
        console.log(`   Username: @${data.username || 'N/A'}`);
        console.log(`   Name: ${data.name || 'N/A'}`);
        console.log(`   Followers: ${data.followers_count || 'N/A'}\n`);

        return true;
    } catch (error) {
        console.log('❌ Error checking Instagram account:', error.message, '\n');
        return false;
    }
}

async function checkTokenPermissions() {
    console.log('3. Checking Access Token Permissions...\n');

    try {
        const response = await fetch(
            `https://graph.facebook.com/v23.0/debug_token?input_token=${META_ACCESS_TOKEN}&access_token=${META_ACCESS_TOKEN}`
        );

        if (!response.ok) {
            console.log('⚠️  Could not verify token permissions\n');
            return false;
        }

        const result = await response.json();
        const data = result.data;

        if (!data) {
            console.log('⚠️  No token data returned\n');
            return false;
        }

        console.log('   Token Info:');
        console.log(`   - Valid: ${data.is_valid ? '✅' : '❌'}`);
        console.log(`   - App ID: ${data.app_id}`);
        console.log(`   - Expires: ${data.expires_at ? new Date(data.expires_at * 1000).toLocaleString() : 'Never'}`);

        if (data.scopes && data.scopes.length > 0) {
            console.log(`   - Permissions: ${data.scopes.join(', ')}`);

            const requiredScopes = ['instagram_basic', 'instagram_manage_messages', 'pages_messaging'];
            const hasRequired = requiredScopes.some(scope => data.scopes.includes(scope));

            if (hasRequired) {
                console.log('   ✅ Has Instagram messaging permissions\n');
            } else {
                console.log('   ⚠️  Missing Instagram messaging permissions');
                console.log(`   Required: ${requiredScopes.join(', ')}\n`);
            }
        } else {
            console.log('   ⚠️  No permissions listed (might be a system token)\n');
        }

        return data.is_valid;
    } catch (error) {
        console.log('⚠️  Error checking permissions:', error.message, '\n');
        return false;
    }
}

async function getInstagramConversations() {
    console.log('4. Checking for Existing Conversations...\n');

    try {
        const response = await fetch(
            `https://graph.facebook.com/v23.0/${META_BUSINESS_ACCOUNT_ID}/conversations?platform=instagram&access_token=${META_ACCESS_TOKEN}`
        );

        if (!response.ok) {
            const error = await response.json();
            console.log('⚠️  Could not fetch conversations');
            console.log(`   Error: ${error.error?.message || 'Unknown error'}\n`);
            return;
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            console.log('⚠️  No existing conversations found');
            console.log('   Instagram requires users to message your business first');
            console.log('   You cannot send messages to users who haven\'t initiated contact\n');
            return;
        }

        console.log(`✅ Found ${data.data.length} conversation(s):`);
        data.data.slice(0, 5).forEach((conv, i) => {
            console.log(`   ${i + 1}. Conversation ID: ${conv.id}`);
        });
        console.log('\n   💡 You can only send messages to users in these conversations\n');

    } catch (error) {
        console.log('⚠️  Error fetching conversations:', error.message, '\n');
    }
}

async function runDiagnostics() {
    const accountOk = await checkInstagramAccount();

    if (!accountOk) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('❌ Instagram Account Verification Failed');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('Next Steps:');
        console.log('1. Verify META_BUSINESS_ACCOUNT_ID is your Instagram Business Account ID');
        console.log('2. Get the correct ID from:');
        console.log('   https://developers.facebook.com/tools/debug/accesstoken/');
        console.log('3. Look for "Instagram Business Account" in the token debugger\n');
        return;
    }

    await checkTokenPermissions();
    await getInstagramConversations();

    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 Summary & Recommendations');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Instagram Messaging Requirements:');
    console.log('1. ✅ Instagram Business Account (not personal account)');
    console.log('2. ✅ Valid access token with instagram_manage_messages permission');
    console.log('3. ⚠️  User must message your business FIRST (24-hour window)');
    console.log('4. ⚠️  Cannot send unsolicited messages to random user IDs\n');

    console.log('To Test Instagram Messaging:');
    console.log('1. Have someone send a message to your Instagram business account');
    console.log('2. Get their Instagram Scoped ID (IGSID) from the webhook');
    console.log('3. Use that IGSID in your test script');
    console.log('4. Send the message within 24 hours of their last message\n');

    console.log('Alternative: Use Instagram Comments API');
    console.log('- You can reply to comments on your posts');
    console.log('- This doesn\'t require the user to message first\n');
}

runDiagnostics().catch(console.error);
