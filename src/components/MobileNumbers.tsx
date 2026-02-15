import { ArrowRight, Star, Smartphone } from 'lucide-react';

const NUMBERS = [
  { carrier: 'Etisalat', number: '050 505 5555', price: 'AED 145,000', starred: true, color: 'green' },
  { carrier: 'Du', number: '055 123 4567', price: 'AED 32,000', starred: false, color: 'blue' },
  { carrier: 'Etisalat', number: '050 100 0001', price: 'AED 95,000', starred: false, color: 'green' },
  { carrier: 'Du', number: '055 999 9999', price: 'Call for Price', starred: true, color: 'blue' },
];

export default function MobileNumbers() {
  return (
    <section id="numbers">
      <div className="flex items-end justify-between mb-12 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center shadow-md overflow-hidden p-1">
            <div className="w-full h-full bg-primary/10 rounded-xl flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-display font-bold text-text-main tracking-tight">VIP Mobile Numbers</h2>
            <p className="text-sm font-bold uppercase tracking-[0.2em] mt-1 text-text-main">Exclusive Platinum &amp; Diamond</p>
          </div>
        </div>
        <a className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors" href="#">
          VIEW ALL
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {NUMBERS.map((item) => (
          <div
            key={item.number}
            className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl p-8 hover:bg-white hover:shadow-xl transition-all cursor-pointer group shadow-sm hover:border-gray-300"
          >
            <div className="flex justify-between items-center mb-6">
              <span
                className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  item.color === 'green'
                    ? 'bg-green-50 border border-green-100 text-green-600'
                    : 'bg-blue-50 border border-blue-100 text-blue-600'
                }`}
              >
                {item.carrier}
              </span>
              {item.starred && <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />}
            </div>
            <p
              className={`text-2xl font-black tracking-widest text-text-main mb-2 font-mono transition-colors ${
                item.color === 'green' ? 'group-hover:text-green-600' : 'group-hover:text-blue-600'
              }`}
            >
              {item.number}
            </p>
            <div className="h-px w-full bg-gray-100 my-4" />
            <p className="text-text-main font-mono font-bold text-xl">{item.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
