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
  abudhabi: '/abudhabi-plate.webp',
  abudhabi2: '/abudhabi-plate2.webp',
  abudhabi_bike: '/AD-B-plate.webp',
  abudhabi_classic: '/AD-C-Plate.webp',
  dubai: '/dubai-plate.webp',
  dubai_bike: '/Dubai-B-plate.webp',
  dubai_classic: '/Dubai-C-Plate.webp',
  ajman: '/ajman-plate.webp',
  ajman_bike: '/Ajman-B-plate.webp',
  ajman_classic: '/ajman-C-plate.webp',
  rak: '/rak-plate.webp',
  rak_bike: '/RAK-B-plate.webp',
  rak_classic: '/RAK-C-Plate.webp',
  fujairah: '/fujariah-plate.webp',
  fujairah_bike: '/FUJ-B-plate.webp',
  sharjah: '/sharjah-plate.webp',
  sharjah_bike: '/SHJ-B-plate.webp',
  sharjah_classic: '/Shj-C-Plate.webp',
  umm_al_quwain: '/umm-al-q-plate.webp',
  umm_al_quwain_bike: '/UAQ-B-plate.webp',
};

export interface EmirateSection {
  nameKey: string;
  subtitleKey: string;
  logo: string;
  emirateKey: string;
}

export const SECTIONS: EmirateSection[] = [
  { nameKey: 'abuDhabiName', subtitleKey: 'capitalCollection', logo: '/Abu_Dhabi-logo.webp', emirateKey: 'abudhabi' },
  { nameKey: 'dubaiName', subtitleKey: 'premiumRtaSeries', logo: '/dubai-logo.webp', emirateKey: 'dubai' },
  { nameKey: 'sharjahName', subtitleKey: 'exclusiveSeries', logo: '/SHARJAH-LOGO.webp', emirateKey: 'sharjah' },
  { nameKey: 'ajmanName', subtitleKey: 'distinctiveCodes', logo: '/ajman-logo.webp', emirateKey: 'ajman' },
  { nameKey: 'uaqName', subtitleKey: 'vintageSelection', logo: '/ummalquein-logo.webp', emirateKey: 'umm_al_quwain' },
  { nameKey: 'rakName', subtitleKey: 'northernEmirates', logo: '/rak-logo.webp', emirateKey: 'rak' },
  { nameKey: 'fujairahName', subtitleKey: 'easternRegion', logo: '/fujairah-logo.webp', emirateKey: 'fujairah' },
];
