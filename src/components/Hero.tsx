import { ArrowDown } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative h-[650px] w-full overflow-hidden flex items-center justify-center text-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale-[20%] contrast-[1.05]"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea904a848bd?q=80&w=2800&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-white/10" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 mt-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-border-light backdrop-blur-sm mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-text-secondary tracking-widest uppercase font-bold">
            Live Auction Platform
          </span>
        </div>
        <h2 className="text-text-main text-5xl md:text-7xl lg:text-8xl font-display font-black mb-6 tracking-tighter leading-tight drop-shadow-sm">
          Exquisite Plates &amp; <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-black">
            VIP Numbers
          </span>
        </h2>
        <p className="text-text-secondary text-lg md:text-xl font-medium tracking-wide max-w-2xl mx-auto mb-10">
          The next-generation marketplace for distinguished UAE license plates and premium mobile numbers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            className="bg-white text-text-main border border-border-light px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
            href="#plates"
          >
            Browse Plates <ArrowDown className="h-4 w-4" />
          </a>
          <a
            className="bg-white text-text-main border border-border-light px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm"
            href="#numbers"
          >
            Mobile Numbers
          </a>
        </div>
      </div>
    </div>
  );
}
