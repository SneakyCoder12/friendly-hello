import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://alnuamigroup.ae';
const SITE_NAME = 'Al Nuami Group';
const DEFAULT_TITLE = 'AL NUAMI | Premium UAE Number Plates & VIP Mobile Numbers';
const DEFAULT_DESCRIPTION =
    'The premier classified marketplace for distinguished UAE license plates and VIP mobile numbers. Browse, list, and connect with sellers directly across all 7 Emirates.';
const DEFAULT_IMAGE = `${SITE_URL}/Logo.png`;

interface SEOProps {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    schema?: Record<string, unknown> | Record<string, unknown>[];
    noindex?: boolean;
}

export default function SEO({
    title,
    description = DEFAULT_DESCRIPTION,
    url,
    image = DEFAULT_IMAGE,
    schema,
    noindex = false,
}: SEOProps) {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const canonical = url ? `${SITE_URL}${url}` : undefined;

    // Wrap single schema or array into a list
    const schemas = schema
        ? Array.isArray(schema)
            ? schema
            : [schema]
        : [];

    return (
        <Helmet>
            {/* Primary */}
            <title>{pageTitle}</title>
            <meta name="description" content={description} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Canonical */}
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            {canonical && <meta property="og:url" content={canonical} />}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="en_AE" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data */}
            {schemas.map((s, i) => (
                <script key={i} type="application/ld+json">
                    {JSON.stringify(s)}
                </script>
            ))}
        </Helmet>
    );
}

/**
 * LocalBusiness schema – injected once globally from App.tsx
 */
export function GlobalSEO() {
    const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Al Nuami Group',
        url: SITE_URL,
        logo: `${SITE_URL}/logo-square.png`,
        image: DEFAULT_IMAGE,
        description: DEFAULT_DESCRIPTION,
        telephone: '+971509912129',
        email: 'alnuamigroups@gmail.com',
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'AE',
            addressLocality: 'Dubai',
        },
        areaServed: {
            '@type': 'Country',
            name: 'United Arab Emirates',
        },
        sameAs: [
            'https://www.instagram.com/bomohammad242',
            'https://www.tiktok.com/@bu.mohmmad242',
            'https://snapchat.com/t/rJdooLC5',
        ],
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(localBusinessSchema)}
            </script>
        </Helmet>
    );
}

export { SITE_URL, SITE_NAME, DEFAULT_IMAGE };
