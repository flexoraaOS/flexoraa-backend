// Script to find your Instagram Business Account ID
require('dotenv').config({ path: './frontend/.env.local' });

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 Finding Your Instagram Business Account ID');
console.log('═══════════════════════════════════════════════════════\n');

async function findInstagramAccount() {
    if (!META_ACCESS_TOKEN) {
        console.log('❌ META_ACCESS_TOKEN not found in .env.local\n');
        return;
    }

    console.log('Step 1: Getting your Facebook Pages...\n');

    try {
        // Get all pages the user manages
        const pagesResponse = await fetch(
            `https://graph.facebook.com/v23.0/me/accounts?access_token=${META_ACCESS_TOKEN}`
        );

        if (!pagesResponse.ok) {
            const error = await pagesResponse.json();
            console.log('❌ Failed to get Facebook Pages');
            console.log(`   Error: ${error.error?.message}\n`);

            if (error.error?.code === 190) {
                console.log('💡 Your access token is invalid or expired');
                console.log('   Generate a new token at: https://developers.facebook.com/tools/explorer/\n');
            }
            return;
        }

        const pagesData = await pagesResponse.json();

        if (!pagesData.data || pagesData.data.length === 0) {
            console.log('❌ No Facebook Pages found');
            console.log('   You need a Facebook Page to have an Instagram Business Account\n');
            console.log('Next Steps:');
            console.log('1. Create a Facebook Page');
            console.log('2. Convert your Instagram to Business Account');
            console.log('3. Connect Instagram to your Facebook Page\n');
            return;
        }

        console.log(`✅ Found ${pagesData.data.length} Facebook Page(s):\n`);

        // Check each page for Instagram account
        for (const page of pagesData.data) {
            console.log(`📄 Page: ${page.name} (ID: ${page.id})`);

            // Get Instagram account for this page
            const igResponse = await fetch(
                `https://graph.facebook.com/v23.0/${page.id}?fields=instagram_business_account&access_token=${META_ACCESS_TOKEN}`
            );

            if (igResponse.ok) {
                const igData = await igResponse.json();

                if (igData.instagram_business_account) {
                    const igId = igData.instagram_business_account.id;
                    console.log(`   ✅ Instagram Business Account Found!`);
                    console.log(`   📱 Instagram Account ID: ${igId}\n`);

                    // Get Instagram account details
                    const igDetailsResponse = await fetch(
                        `https://graph.facebook.com/v23.0/${igId}?fields=id,username,name,profile_picture_url&access_token=${META_ACCESS_TOKEN}`
                    );

                    if (igDetailsResponse.ok) {
                        const igDetails = await igDetailsResponse.json();
                        console.log(`   Username: @${igDetails.username || 'N/A'}`);
                        console.log(`   Name: ${igDetails.name || 'N/A'}\n`);
                    }

                    console.log('═══════════════════════════════════════════════════════');
                    console.log('✅ SUCCESS! Add this to your .env.local:');
                    console.log('═══════════════════════════════════════════════════════\n');
                    console.log(`META_INSTAGRAM_ACCOUNT_ID=${igId}\n`);
                    console.log('Then update your code to use this ID for Instagram messages.\n');
                    return igId;
                } else {
                    console.log(`   ⚠️  No Instagram account connected to this page\n`);
                }
            }
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('❌ No Instagram Business Account Found');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('Your Facebook Pages don\'t have Instagram accounts connected.\n');
        console.log('To fix this:');
        console.log('1. Open Instagram app');
        console.log('2. Go to Settings → Account → Switch to Professional Account');
        console.log('3. Choose "Business"');
        console.log('4. Connect to your Facebook Page');
        console.log('5. Run this script again\n');

    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }
}

findInstagramAccount();
