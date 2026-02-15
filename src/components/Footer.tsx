import { LayoutGrid, Facebook, Camera, AtSign } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <LayoutGrid className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display font-black text-2xl text-text-main">AL NUAMI</span>
            </div>
            <p className="text-gray-500 leading-relaxed text-sm">
              The premier destination for buying and selling distinguished license plates and VIP mobile numbers in the United Arab Emirates. Experience secure, transparent, and exclusive auctions.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-text-main mb-6 text-sm uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><a className="hover:text-primary transition-colors" href="#">Abu Dhabi Plates</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Dubai Plates</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Mobile Numbers</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Private Listings</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-text-main mb-6 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><a className="hover:text-primary transition-colors" href="#">Contact Us</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-400 font-medium">© 2025 AL NUAMI UAE. All rights reserved.</p>
          <div className="flex gap-4">
            <a className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all duration-300" href="#">
              <Facebook className="h-4 w-4" />
            </a>
            <a className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all duration-300" href="#">
              <Camera className="h-4 w-4" />
            </a>
            <a className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all duration-300" href="#">
              <AtSign className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
