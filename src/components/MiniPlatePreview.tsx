import { usePlateImage } from '@/hooks/usePlateGenerator';

/**
 * Map DB emirate names (e.g. "Abu Dhabi") to the plate‑template keys used
 * by the generator engine (e.g. "abudhabi").
 */
const EMIRATE_KEY_MAP: Record<string, string> = {
    'Abu Dhabi': 'abudhabi',
    'Dubai': 'dubai',
    'Sharjah': 'sharjah',
    'Ajman': 'ajman',
    'Umm Al Quwain': 'umm_al_quwain',
    'Ras Al Khaimah': 'rak',
    'Fujairah': 'fujairah',
};

interface MiniPlatePreviewProps {
    emirate: string;
    code: string;
    number: string;
    vehicleType?: 'car' | 'bike' | 'classic';
    className?: string;
}

export default function MiniPlatePreview({
    emirate,
    code,
    number,
    vehicleType = 'car',
    className = '',
}: MiniPlatePreviewProps) {
    const emirateKey = EMIRATE_KEY_MAP[emirate] || emirate.toLowerCase().replace(/\s+/g, '_');
    const plateStyle = vehicleType === 'bike' ? 'bike' : (vehicleType === 'classic' ? 'classic' : 'private');
    const dataUrl = usePlateImage(emirateKey, code, number, plateStyle);

    if (!dataUrl) {
        return (
            <div className={`bg-gradient-to-br from-gray-100 to-gray-50 border border-border/60 rounded-lg flex items-center justify-center animate-pulse ${className}`}>
                <span className="text-[9px] text-muted-foreground font-mono">
                    {code ? `${code} ` : ''}{number || '—'}
                </span>
            </div>
        );
    }

    return (
        <img
            src={dataUrl}
            alt={`${code} ${number}`}
            className={`object-contain rounded-lg shadow-sm ${className}`}
            draggable={false}
        />
    );
}
