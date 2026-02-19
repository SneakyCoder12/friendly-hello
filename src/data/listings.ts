export interface PlateListing {
  emirate: string;
  code: string;
  number: string;
  price: string;
  priceType: 'bid' | 'fixed';
}

export const LISTINGS: PlateListing[] = [
  // Abu Dhabi
  { emirate: 'abudhabi', code: '2', number: '55555', price: 'AED 45,000', priceType: 'bid' },
  { emirate: 'abudhabi', code: '11', number: '1212', price: 'AED 82,500', priceType: 'bid' },
  { emirate: 'abudhabi', code: '5', number: '99', price: 'AED 120,000', priceType: 'fixed' },
  { emirate: 'abudhabi', code: '17', number: '700', price: 'AED 38,000', priceType: 'bid' },
  // Dubai
  { emirate: 'dubai', code: 'A', number: '333', price: 'AED 210,000', priceType: 'bid' },
  { emirate: 'dubai', code: 'W', number: '88', price: 'AED 550,000', priceType: 'bid' },
  { emirate: 'dubai', code: 'AA', number: '10', price: 'AED 3.2M', priceType: 'fixed' },
  { emirate: 'dubai', code: 'R', number: '402', price: 'AED 18,500', priceType: 'bid' },
  // Sharjah
  { emirate: 'sharjah', code: '3', number: '123', price: 'AED 15,000', priceType: 'bid' },
  { emirate: 'sharjah', code: '5', number: '7', price: 'AED 280,000', priceType: 'fixed' },
  { emirate: 'sharjah', code: '1', number: '909', price: 'AED 42,000', priceType: 'bid' },
  { emirate: 'sharjah', code: '2', number: '101', price: 'AED 75,000', priceType: 'fixed' },
  // Ajman
  { emirate: 'ajman', code: 'H', number: '8888', price: 'AED 28,000', priceType: 'bid' },
  { emirate: 'ajman', code: 'B', number: '50', price: 'AED 65,000', priceType: 'fixed' },
  { emirate: 'ajman', code: 'A', number: '999', price: 'AED 33,500', priceType: 'bid' },
  { emirate: 'ajman', code: 'C', number: '1234', price: 'AED 12,000', priceType: 'bid' },
  // Umm Al Quwain
  { emirate: 'umm_al_quwain', code: 'X', number: '77', price: 'AED 45,000', priceType: 'bid' },
  { emirate: 'umm_al_quwain', code: 'I', number: '2020', price: 'AED 32,000', priceType: 'fixed' },
  { emirate: 'umm_al_quwain', code: 'A', number: '9', price: 'AED 195,000', priceType: 'bid' },
  { emirate: 'umm_al_quwain', code: 'B', number: '500', price: 'AED 22,000', priceType: 'bid' },
  // Ras Al Khaimah
  { emirate: 'rak', code: 'V', number: '500', price: 'AED 58,000', priceType: 'bid' },
  { emirate: 'rak', code: 'Y', number: '111', price: 'AED 95,000', priceType: 'fixed' },
  { emirate: 'rak', code: 'K', number: '70', price: 'AED 115,000', priceType: 'bid' },
  { emirate: 'rak', code: 'M', number: '23', price: 'AED 48,000', priceType: 'bid' },
  // Fujairah
  { emirate: 'fujairah', code: 'M', number: '888', price: 'AED 35,000', priceType: 'bid' },
  { emirate: 'fujairah', code: 'C', number: '11', price: 'AED 180,000', priceType: 'fixed' },
  { emirate: 'fujairah', code: 'K', number: '5050', price: 'AED 12,500', priceType: 'bid' },
  { emirate: 'fujairah', code: 'A', number: '300', price: 'AED 25,000', priceType: 'bid' },
];

export const PLATE_TEMPLATES: Record<string, string> = {
  abudhabi: '/abudhabi-plate.png',
  abudhabi_bike: '/AD-B-plate.png',
  abudhabi_classic: '/AD-C-Plate.png',
  dubai: '/dubai-plate.png',
  dubai_bike: '/Dubai-B-plate.png',
  dubai_classic: '/Dubai-C-Plate.png',
  ajman: '/ajman-plate.png',
  ajman_bike: '/Ajman-B-plate.png',
  ajman_classic: '/ajman-C-plate.png',
  rak: '/rak-plate.png',
  rak_bike: '/RAK-B-plate.png',
  rak_classic: '/RAK-C-Plate.png',
  fujairah: '/fujariah-plate.png',
  fujairah_bike: '/FUJ-B-plate.png',
  sharjah: '/sharjah-plate.png',
  sharjah_bike: '/SHJ-B-plate.png',
  sharjah_classic: '/Shj-C-Plate.png',
  umm_al_quwain: '/umm-al-q-plate.png',
  umm_al_quwain_bike: '/UAQ-B-plate.png',
};

export interface EmirateSection {
  name: string;
  subtitle: string;
  logo: string;
  emirateKey: string;
}

export const SECTIONS: EmirateSection[] = [
  { name: 'Abu Dhabi', subtitle: 'Capital Collection', logo: '/Abu_Dhabi-logo.png', emirateKey: 'abudhabi' },
  { name: 'Dubai', subtitle: 'Premium RTA Series', logo: '/dubai-logo.png', emirateKey: 'dubai' },
  { name: 'Sharjah', subtitle: 'Exclusive Series', logo: '/SHARJAH-LOGO.png', emirateKey: 'sharjah' },
  { name: 'Ajman', subtitle: 'Distinctive Codes', logo: '/ajman-logo.png', emirateKey: 'ajman' },
  { name: 'Umm Al Quwain', subtitle: 'Vintage Selection', logo: '/ummalquein-logo.png', emirateKey: 'umm_al_quwain' },
  { name: 'Ras Al Khaimah', subtitle: 'Northern Emirates', logo: '/rak-logo.png', emirateKey: 'rak' },
  { name: 'Fujairah', subtitle: 'Eastern Region Collection', logo: '/fujairah-logo.png', emirateKey: 'fujairah' },
];
