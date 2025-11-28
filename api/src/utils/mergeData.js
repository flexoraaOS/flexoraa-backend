/**
 * Merge two arrays by matching field
 * Implements n8n "Merge" node behavior:
 * - mode: "combine"
 * - joinMode: "keepEverything" (LEFT JOIN)
 * - Fields to match: specified field (usually user_id or phone_number)
 */

function mergeByField(array1, array2, field) {
    if (!Array.isArray(array1) || !Array.isArray(array2)) {
        throw new Error('Both inputs must be arrays');
    }

    // LEFT JOIN behavior (keepEverything)
    return array1.map(item1 => {
        const match = array2.find(item2 => item2[field] === item1[field]);
        return {
            ...item1,
            ...(match || {})
        };
    });
}

module.exports = { mergeByField };
