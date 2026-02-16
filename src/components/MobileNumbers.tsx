import { ArrowRight, Star, Smartphone } from 'lucide-react';

const NUMBERS = [
  { carrier: 'Etisalat', number: '050 505 5555', price: 'AED 145,000', starred: true, color: 'green' },
  { carrier: 'Du', number: '055 123 4567', price: 'AED 32,000', starred: false, color: 'blue' },
  { carrier: 'Etisalat', number: '050 100 0001', price: 'AED 95,000', starred: false, color: 'green' },
  { carrier: 'Du', number: '055 999 9999', price: 'Call for Price', starred: true, color: 'blue' },
];

function CarrierLogo({ carrier, color }: { carrier: string; color: string }) {
  if (carrier === 'Etisalat') {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
        <span className="text-xs">e&</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
      <span className="text-xs font-black" style={{ color: '#003b71' }}>du</span>
    </span>
  );
}

export default function MobileNumbers() {
  return (
    <section id="numbers">
      <div className="flex items-end justify-between mb-12 border-b border-border pb-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 bg-card border border-border rounded-2xl flex flex-col items-center justify-center shadow-md overflow-hidden p-1">
            <div className="w-full h-full bg-primary/10 rounded-xl flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-display font-bold text-foreground tracking-tight">VIP Mobile Numbers</h2>
            <p className="text-sm font-bold uppercase tracking-[0.2em] mt-1 text-muted-foreground">Exclusive Platinum &amp; Diamond</p>
          </div>
        </div>
        <a className="group flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors" href="#">
          VIEW ALL
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {NUMBERS.map((item) => (
          <div
            key={item.number}
            className="bg-card backdrop-blur-md border border-border rounded-xl p-8 hover:bg-surface hover:shadow-xl transition-all cursor-pointer group shadow-sm hover:border-primary/30"
          >
            <div className="flex justify-between items-center mb-6">
              <CarrierLogo carrier={item.carrier} color={item.color} />
              {item.starred && <Star className="h-5 w-5 text-amber-400 fill-amber-400" />}
            </div>
            <p className="text-2xl font-black tracking-widest text-foreground mb-2 font-mono transition-colors group-hover:text-primary">
              {item.number}
            </p>
            <div className="h-px w-full bg-border my-4" />
            <p className="text-foreground font-mono font-bold text-xl">{item.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
