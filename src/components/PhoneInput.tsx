import { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi', flag: '🇸🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
];

const UAE_PREFIXES = ['50', '52', '54', '55', '56', '58'];

function formatUAEPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

function validateUAEPhone(digits: string): string | null {
  if (!digits) return null;
  if (digits.length !== 9) return 'UAE number must be 9 digits';
  if (!UAE_PREFIXES.some(p => digits.startsWith(p))) return `Must start with ${UAE_PREFIXES.join(', ')}`;
  return null;
}

interface PhoneInputProps {
  value: string; // full phone with country code e.g. "+971501234567"
  onChange: (fullPhone: string) => void;
  required?: boolean;
  showValidation?: boolean;
}

export default function PhoneInput({ value, onChange, required, showValidation = true }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse current value
  const matchedCountry = COUNTRY_CODES.find(c => value.startsWith(c.code));
  const [selectedCode, setSelectedCode] = useState(matchedCountry?.code || '+971');
  const localNumber = matchedCountry ? value.slice(matchedCountry.code.length) : value.replace(/^\+\d+/, '');

  const selected = COUNTRY_CODES.find(c => c.code === selectedCode) || COUNTRY_CODES[0];
  const isUAE = selectedCode === '+971';
  const digits = localNumber.replace(/\D/g, '');
  const displayValue = isUAE ? formatUAEPhone(digits) : localNumber;
  const error = isUAE && showValidation && digits.length > 0 ? validateUAEPhone(digits) : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    const limited = isUAE ? cleaned.slice(0, 9) : cleaned.slice(0, 15);
    onChange(`${selectedCode}${limited}`);
  };

  const handleCodeChange = (code: string) => {
    setSelectedCode(code);
    onChange(`${code}${digits}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <div className="flex">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 bg-surface border border-border rounded-s-xl px-3 py-3 text-sm text-foreground hover:bg-surface-accent transition-colors border-e-0 ps-10"
        >
          <span>{selected.flag}</span>
          <span className="font-mono text-xs">{selected.code}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        <input
          type="tel"
          required={required}
          value={displayValue}
          onChange={e => handleInput(e.target.value)}
          className={`flex-1 bg-surface border border-border rounded-e-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono ${error ? 'border-red-500 focus:ring-red-500/30' : ''}`}
          placeholder={isUAE ? '50 123 4567' : 'Phone number'}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
      {open && (
        <div className="absolute top-full mt-1 start-0 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden w-64 max-h-60 overflow-y-auto">
          {COUNTRY_CODES.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleCodeChange(c.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface transition-colors ${c.code === selectedCode ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
            >
              <span>{c.flag}</span>
              <span className="font-mono">{c.code}</span>
              <span className="text-muted-foreground text-xs">{c.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
