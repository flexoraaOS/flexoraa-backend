/**
 * Phone number formatter
 * Matches n8n expression: {{ $json.PhoneNumber.replace(/^00/, '+') }}
 */

function formatPhoneNumber(phone) {
    if (!phone) return '';
    // Replace 00 prefix with +
    // Example: 00491234567890 → +491234567890
    return phone.replace(/^00/, '+');
}

module.exports = { formatPhoneNumber };
