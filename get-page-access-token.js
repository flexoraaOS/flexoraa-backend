// Get Facebook Page Access Token
require('dotenv').config({ path: './frontend/.env.local' });

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

console.log('═══════════════════════════════════════════════════════');
console.log('🔑 Getting Facebook Page Access Token');
console.log('═══════════════════════════════════════════════════════\n');

async function getPageAccessToken() {
    if (!META_ACCESS_TOKEN) {
        console.log('❌ META_ACCESS_TOKEN not found in .env.local\n');
        return;
    }

    try {
        // Get pages with access tokens
        const response = await fetch(
            `https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,category&access_token=${META_ACCESS_TOKEN}`
        );

        if (!response.ok) {
            const error = await response.json();
            console.log('❌ Failed to get Facebook Pages');
            console.log(`   Error: ${error.error?.message}\n`);

            if (error.error?.code === 190) {
                console.log('💡 Your user access token is invalid or expired');
                console.log('   Generate a new token at: https://developers.facebook.com/tools/explorer/\n');
            }

            return;
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            console.log('❌ No Facebook Pages found\n');
            console.log('You need to:');
            console.log('1. Create a Facebook Page');
            console.log('2. Make sure your app has pages_messaging permission');
            console.log('3. Regenerate your access token\n');
            return;
        }

        console.log(`✅ Found ${data.data.length} Facebook Page(s):\n`);

        data.data.forEach((page, i) => {
            console.log(`${i + 1}. ${page.name}`);
            console.log(`   Page ID: ${page.id}`);
            console.log(`   Category: ${page.category || 'N/A'}`);
            console.log(`   Page Access Token: ${page.access_token ? page.access_token.substring(0, 30) + '...' : 'Not available'}\n`);
        });

        const mainPage = data.data[0];

        if (mainPage.access_token) {
            console.log('═══════════════════════════════════════════════════════');
            console.log('✅ Page Access Token Found!');
            console.log('═══════════════════════════════════════════════════════\n');
            console.log('Add this to your frontend/.env.local:\n');
            console.log(`META_PAGE_ACCESS_TOKEN=${mainPage.access_token}\n`);
            console.log('This token is specific to your Facebook Page and has');
            console.log('the permissions needed for Messenger API.\n');

            // Test the page token
            console.log('Testing Page Access Token...\n');
            await testPageToken(mainPage.id, mainPage.access_token);

        } else {
            console.log('⚠️  Page Access Token not available\n');
            console.log('This usually means:');
            console.log('1. Your user token doesn\'t have pages_manage_metadata permission');
            console.log('2. You need to regenerate your token with correct permissions\n');
            console.log('Required permissions:');
            console.log('- pages_messaging');
            console.log('- pages_manage_metadata');
            console.log('- pages_read_engagement\n');
        }

    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }
}

async function testPageToken(pageId, pageToken) {
    try {
        // Test if we can access conversations with page token
        const response = await fetch(
            `https://graph.facebook.com/v23.0/${pageId}/conversations?access_token=${pageToken}`
        );

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Page token works! Found ${data.data?.length || 0} conversation(s)\n`);

            if (data.data && data.data.length > 0) {
                console.log('You have existing Messenger conversations!');
                console.log('Run: node test-facebook-messenger.js to test sending\n');
            } else {
                console.log('No conversations yet. Have someone message your Page to test.\n');
            }
        } else {
            const error = await response.json();
            console.log('⚠️  Page token test failed');
            console.log(`   Error: ${error.error?.message}\n`);
        }
    } catch (error) {
        console.log('⚠️  Could not test page token:', error.message, '\n');
    }
}

getPageAccessToken();
