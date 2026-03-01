export interface PlateListingForUrl {
    id: string;
    emirate?: string;
    plate_number?: string;
}

/**
 * Generates an SEO friendly short-slug URL for a plate listing.
 * Example: "dubai-e-65246-a1b2c3d4"
 */
export function generatePlateSlug(listing: PlateListingForUrl): string {
    if (!listing?.id) return '';
    if (!listing.emirate || !listing.plate_number) return listing.id;

    const formattedEmirate = listing.emirate.toLowerCase().replace(/\s+/g, '-');
    const formattedPlate = listing.plate_number.toLowerCase().replace(/\s+/g, '-');
    const shortId = listing.id.split('-')[0];

    return `${formattedEmirate}-${formattedPlate}-${shortId}`;
}
