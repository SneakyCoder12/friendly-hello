export const COUNTRY_CODES = [
    { code: '+971', country: 'UAE', suffix: 'AE' },
    { code: '+966', country: 'Saudi Arabia', suffix: 'SA' },
    { code: '+965', country: 'Kuwait', suffix: 'KW' },
    { code: '+974', country: 'Qatar', suffix: 'QA' },
    { code: '+973', country: 'Bahrain', suffix: 'BH' },
    { code: '+968', country: 'Oman', suffix: 'OM' },
    { code: '+1', country: 'USA/Canada', suffix: 'US' },
    { code: '+44', country: 'UK', suffix: 'GB' },
    { code: '+91', country: 'India', suffix: 'IN' },
    { code: '+92', country: 'Pakistan', suffix: 'PK' },
];

/**
 * Strictly normalizes phone numbers (especially UAE variations) into a pure baseline.
 * Handles inputs like '0501234567', '501234567', '9710501234567'.
 */
export function normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    // Fix UAE specific variations to ensure consistency across the DB
    if (cleaned.startsWith('97105')) {
        // User typed +971 050 ... -> Strip the extra 0
        cleaned = '971' + cleaned.substring(4);
    } else if (cleaned.startsWith('05')) {
        // User typed 050 ... (local format) -> Convert to 97150
        cleaned = '971' + cleaned.substring(1);
    } else if (cleaned.startsWith('5') && (cleaned.length === 9 || cleaned.length === 8)) {
        // User typed 50 ... -> Prepend 971
        cleaned = '971' + cleaned;
    }

    return cleaned;
}

/**
 * Converts a string comprising of an international dialing code + phone number 
 * into a safe, pseudo email address for Supabase standard auth.
 * E.g., "+971501234567" -> "971501234567@phone-user.alnuami.com"
 */
export function formatPhoneAsEmail(phone: string): string {
    const cleaned = normalizePhone(phone);
    return `${cleaned}@phone-user.alnuami.com`;
}

/**
 * Checks whether an input string looks like a phone number (i.e. strictly digits, pluses, dashes, spaces).
 */
export function isPhoneNumber(input: string): boolean {
    const stripped = input.replace(/[\s\-\+]/g, '');
    return /^\d+$/.test(stripped) && stripped.length >= 6;
}
