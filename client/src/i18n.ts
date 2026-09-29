export type Locale = 'en' | 'ta';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.bookings': 'Bookings',
    'nav.wishlist': 'Wishlist',
    'nav.notifications': 'Notifications',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'search.placeholder': 'Search equipment...',
    'search.button': 'Search',
    'booking.title': 'Book Equipment',
    'booking.startDate': 'Start Date',
    'booking.endDate': 'End Date',
    'booking.confirm': 'Confirm Booking',
    'booking.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
  },
  ta: {
    'nav.home': 'முகப்பு',
    'nav.search': 'தேடல்',
    'nav.bookings': 'முன்பதிவுகள்',
    'nav.wishlist': 'விருப்பப்பட்டியல்',
    'nav.notifications': 'அறிவிப்புகள்',
    'nav.login': 'உள்நுழை',
    'nav.logout': 'வெளியேறு',
    'search.placeholder': 'உபகரணங்களைத் தேடுங்கள்...',
    'search.button': 'தேடு',
    'booking.title': 'உபகரணம் முன்பதிவு',
    'booking.startDate': 'தொடக்க தேதி',
    'booking.endDate': 'முடிவு தேதி',
    'booking.confirm': 'முன்பதிவை உறுதிப்படுத்து',
    'booking.cancel': 'ரத்து செய்',
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'ஏதோ தவறு ஏற்பட்டது',
    'common.save': 'சேமி',
    'common.delete': 'நீக்கு',
    'common.edit': 'திருத்து',
    'common.back': 'பின்',
  },
};

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  return translations[currentLocale][key] ?? key;
}
