import { LayoutGrid } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="absolute w-full top-0 z-50 border-b border-border-light bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer group">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tighter text-text-main">
                AL <span className="text-text-main">NUAMI</span>
              </h1>
            </div>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <a className="text-sm font-medium text-text-main hover:text-primary transition-colors" href="#">Home</a>
            <a className="text-sm font-medium text-text-secondary hover:text-text-main transition-colors" href="#">Auctions</a>
            <a className="text-sm font-medium text-text-secondary hover:text-text-main transition-colors" href="#generator">Generator</a>
            <a className="text-sm font-medium text-text-secondary hover:text-text-main transition-colors" href="#">Sell</a>
            <a className="text-sm font-medium text-text-secondary hover:text-text-main transition-colors" href="#">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-text-secondary hover:text-text-main font-medium text-sm transition-colors">
              Log In
            </button>
            <button className="bg-text-main text-white hover:bg-gray-800 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all transform hover:-translate-y-0.5">
              Register
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
