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
 * Converts a string comprising of an international dialing code + phone number 
 * into a safe, pseudo email address for Supabase standard auth.
 * E.g., "+971501234567" -> "971501234567@phone-user.alnuami.com"
 */
export function formatPhoneAsEmail(phone: string): string {
    // Strip everything except numeric digits
    const cleaned = phone.replace(/\D/g, '');
    return `${cleaned}@phone-user.alnuami.com`;
}

/**
 * Checks whether an input string looks like a phone number (i.e. strictly digits, pluses, dashes, spaces).
 */
export function isPhoneNumber(input: string): boolean {
    const stripped = input.replace(/[\s\-\+]/g, '');
    return /^\d+$/.test(stripped) && stripped.length >= 6;
}
