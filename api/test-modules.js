// Test script to verify new modules load correctly
try {
    console.log('Loading Instagram Service...');
    require('./src/services/whatsapp/instagramService');
    console.log('✅ Instagram Service loaded');

    console.log('Loading Facebook Service...');
    require('./src/services/whatsapp/facebookService');
    console.log('✅ Facebook Service loaded');

    console.log('Loading Unified Inbox Service...');
    require('./src/services/unifiedInboxService');
    console.log('✅ Unified Inbox Service loaded');

    console.log('Loading Razorpay Service...');
    require('./src/services/payment/razorpayService');
    console.log('✅ Razorpay Service loaded');

    console.log('Loading Analytics Service...');
    require('./src/services/analyticsService');
    console.log('✅ Analytics Service loaded');

    console.log('Loading Email Service...');
    require('./src/services/emailService');
    console.log('✅ Email Service loaded');

    console.log('🎉 All new modules loaded successfully!');
} catch (error) {
    console.error('❌ Failed to load module:', error);
    process.exit(1);
}
