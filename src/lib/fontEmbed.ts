/**
 * Fetches the Cinzel Decorative font from Google Fonts,
 * converts the font files to base64, and returns a CSS string
 * with @font-face declarations that can be used inline with html-to-image.
 *
 * This solves the issue where html-to-image cannot read cross-origin
 * Google Fonts stylesheets, causing fallback fonts in downloaded previews.
 */

let cachedFontCSS: string | null = null;

export async function getCinzelDecorativeFontCSS(): Promise<string> {
    if (cachedFontCSS) return cachedFontCSS;

    try {
        // Fetch the CSS from Google Fonts
        const cssResponse = await fetch(
            'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&display=swap'
        );

        if (!cssResponse.ok) {
            throw new Error(`Failed to fetch font CSS: ${cssResponse.status}`);
        }

        let css = await cssResponse.text();

        // Find all url(...) format('...') references and replace them with base64 data URIs
        // This regex captures both the URL and the format declaration together
        const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s*format\(['"]([^'"]+)['"]\)/g;
        const matches = [...css.matchAll(urlRegex)];

        for (const match of matches) {
            const fontUrl = match[1];
            const format = match[2]; // e.g. 'woff2'

            try {
                const fontResponse = await fetch(fontUrl);
                if (!fontResponse.ok) continue;

                const fontBuffer = await fontResponse.arrayBuffer();
                const base64String = arrayBufferToBase64(fontBuffer);

                // Determine correct MIME type
                const mimeType = format === 'woff2'
                    ? 'font/woff2'
                    : format === 'woff'
                        ? 'font/woff'
                        : 'font/ttf';

                const dataUri = `data:${mimeType};base64,${base64String}`;

                // Replace the entire url(...) format('...') with the data URI version
                css = css.replace(
                    match[0],
                    `url(${dataUri}) format('${format}')`
                );
            } catch (e) {
                console.warn(`Failed to fetch font file: ${fontUrl}`, e);
            }
        }

        // Also handle any url() without format() (shouldn't happen with Google Fonts but just in case)
        const simpleUrlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
        const simpleMatches = [...css.matchAll(simpleUrlRegex)];

        for (const match of simpleMatches) {
            const fontUrl = match[1];
            try {
                const fontResponse = await fetch(fontUrl);
                if (!fontResponse.ok) continue;

                const fontBuffer = await fontResponse.arrayBuffer();
                const base64String = arrayBufferToBase64(fontBuffer);

                const format = fontUrl.includes('.woff2') ? 'font/woff2'
                    : fontUrl.includes('.woff') ? 'font/woff' : 'font/ttf';

                const dataUri = `data:${format};base64,${base64String}`;

                css = css.replace(
                    `url(${fontUrl})`,
                    `url(${dataUri})`
                );
            } catch (e) {
                console.warn(`Failed to fetch font file: ${fontUrl}`, e);
            }
        }

        // Remove unicode-range declarations — they can prevent the font from
        // being used for certain characters in SVG foreignObject rendering
        css = css.replace(/unicode-range:[^;]+;/g, '');

        cachedFontCSS = css;
        return css;
    } catch (error) {
        console.error('Failed to generate inline font CSS:', error);
        return '';
    }
}

/** Convert ArrayBuffer to base64 string (avoids FileReader MIME type issues) */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
