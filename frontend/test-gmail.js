// Test Gmail SMTP Configuration
// Run this with: node test-gmail.js

const nodemailer = require('nodemailer');

async function testGmailSMTP() {
    console.log('🧪 Testing Gmail SMTP Configuration...\n');

    // Check environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    console.log('Environment Variables Check:');
    console.log('GMAIL_USER:', gmailUser ? '✅ Set' : '❌ Missing');
    console.log('GMAIL_APP_PASSWORD:', gmailPassword ? '✅ Set' : '❌ Missing');

    if (!gmailUser || !gmailPassword) {
        console.log('\n❌ Please set your environment variables first:');
        console.log('GMAIL_USER=your-email@gmail.com');
        console.log('GMAIL_APP_PASSWORD=your-16-character-app-password');
        return;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            pass: gmailPassword,
        },
        debug: true,
        logger: true,
    });

    try {
        // Verify connection
        console.log('\n🔍 Verifying Gmail SMTP connection...');
        await transporter.verify();
        console.log('✅ Gmail SMTP connection verified successfully!');

        // Send test email
        console.log('\n📧 Sending test email...');
        const info = await transporter.sendMail({
            from: `"Test" <${gmailUser}>`,
            to: gmailUser, // Send to yourself for testing
            subject: "Gmail SMTP Test - Flexoraa",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ec4343;">Gmail SMTP Test</h2>
          <p>Hello,</p>
          <p>This is a test email to verify your Gmail SMTP configuration is working correctly.</p>
          <p>If you received this email, your Gmail SMTP setup is successful! 🎉</p>
          <p>Best regards,<br>Flexoraa Team</p>
        </div>
      `,
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('\n🎉 Gmail SMTP is working perfectly!');

    } catch (error) {
        console.error('\n❌ Gmail SMTP test failed:');
        console.error('Error:', error.message);

        if (error.message.includes('Invalid login')) {
            console.log('\n🔧 Possible solutions:');
            console.log('1. Make sure you\'re using an App Password, not your regular Gmail password');
            console.log('2. Verify the App Password is exactly 16 characters');
            console.log('3. Ensure 2-Factor Authentication is enabled on your Gmail account');
            console.log('4. Try generating a new App Password');
        }
    }
}

// Run the test
testGmailSMTP();
