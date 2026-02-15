import { Info } from 'lucide-react';

export default function NoticeBanner() {
  return (
    <div className="bg-blue-50 border-y border-blue-100 text-text-main py-4 px-4 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 text-center sm:text-left">
        <Info className="h-5 w-5 text-text-main hidden sm:block flex-shrink-0" />
        <p className="text-sm font-medium text-gray-600 tracking-wide leading-tight mx-auto sm:mx-0">
          <span className="font-bold text-text-main uppercase tracking-wider mr-2">Notice:</span>
          We facilitate connections but are not liable for private transactions between buyers and sellers.
        </p>
      </div>
    </div>
  );
}
