/**
 * Data Merge Utility
 * Implements n8n "Merge" node behavior for combining arrays by matching field
 * Uses LEFT JOIN semantics (keepEverything mode)
 * 
 * @module utils/mergeData
 */

/**
 * Merge two arrays by matching field values
 * Implements n8n Merge node behavior:
 * - mode: "combine"
 * - joinMode: "keepEverything" (LEFT JOIN)
 * - Fields to match: specified field (usually user_id or phone_number)
 * 
 * @param {Array<Object>} array1 - Primary array (all items will be in result)
 * @param {Array<Object>} array2 - Secondary array (matched items will be merged)
 * @param {string} field - Field name to match on (e.g., 'user_id')
 * @returns {Array<Object>} Merged array with all items from array1 plus matched data from array2
 * @throws {Error} If inputs are not arrays or field is not a string
 * 
 * @example
 * const leads = [
 *   { user_id: '1', name: 'John' },
 *   { user_id: '2', name: 'Jane' }
 * ];
 * const campaigns = [
 *   { user_id: '1', campaign: 'Summer Sale' }
 * ];
 * const merged = mergeByField(leads, campaigns, 'user_id');
 * // Result: [
 * //   { user_id: '1', name: 'John', campaign: 'Summer Sale' },
 * //   { user_id: '2', name: 'Jane' }
 * // ]
 */
function mergeByField(array1, array2, field) {
    // Input validation
    if (!Array.isArray(array1)) {
        throw new Error('First argument must be an array');
    }

    if (!Array.isArray(array2)) {
        throw new Error('Second argument must be an array');
    }

    if (!field || typeof field !== 'string') {
        throw new Error('Field must be a non-empty string');
    }

    // LEFT JOIN behavior (keepEverything)
    // All items from array1 are preserved
    // Matching items from array2 are merged in
    return array1.map(item1 => {
        // Find matching item in array2
        const match = array2.find(item2 => item2[field] === item1[field]);

        // Merge: properties from match override item1 if present
        return {
            ...item1,
            ...(match || {})
        };
    });
}

module.exports = {
    mergeByField
};
