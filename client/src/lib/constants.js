export const JERSEY_COLORS = [
  // Base
  { name: 'Beyaz', hex: '#FFFFFF' },
  { name: 'Siyah', hex: '#111111' },
  { name: 'Gri', hex: '#808080' },
  { name: 'Gümüş', hex: '#C0C0C0' },
  // Blues
  { name: 'Lacivert', hex: '#003087' },
  { name: 'Mavi', hex: '#0070B8' },
  { name: 'Açık Mavi', hex: '#6BAED6' },
  { name: 'Gökyüzü Mavisi', hex: '#87CEEB' },
  { name: 'Turkuaz', hex: '#00CED1' },
  { name: 'Petrol', hex: '#006E7F' },
  // Reds
  { name: 'Kırmızı', hex: '#E41E20' },
  { name: 'Koyu Kırmızı', hex: '#8B0000' },
  { name: 'Bordo', hex: '#800020' },
  { name: 'Pembe', hex: '#FF69B4' },
  { name: 'Mercan', hex: '#FF6B6B' },
  // Yellows & Oranges
  { name: 'Sarı', hex: '#FFD700' },
  { name: 'Altın', hex: '#CFB53B' },
  { name: 'Turuncu', hex: '#FF6B00' },
  { name: 'Amber', hex: '#FFBF00' },
  // Greens
  { name: 'Yeşil', hex: '#00A651' },
  { name: 'Koyu Yeşil', hex: '#006400' },
  { name: 'Neon Yeşil', hex: '#39FF14' },
  { name: 'Zeytin', hex: '#6B8E23' },
  // Purples & Browns
  { name: 'Mor', hex: '#6A0DAD' },
  { name: 'Leylak', hex: '#9370DB' },
  { name: 'Kahverengi', hex: '#7B3F00' },
  { name: 'Bej', hex: '#F5DEB3' },
  // Neons
  { name: 'Neon Sarı', hex: '#CCFF00' },
  { name: 'Neon Turuncu', hex: '#FF6600' },
  { name: 'Neon Pembe', hex: '#FF1493' },
];

export const JERSEY_TYPES = [
  'home', 'away', '3rd', '4th', '5th', 'anniversary', 'special',
  'pre-match', 'shorts', 'jacket', 'training', 'goalkeeper', 'other',
];

export const JERSEY_QUALITIES = [
  'supporter-tee', 'replica', 'authentic', 'player-issue', 'match-issue', 'match-worn',
];

export const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

export const CONDITIONS = [
  'Sıfır etiketli', 'Sıfır etiketli defolu', 'Sıfır',
  'Sıfır defolu', 'Mükemmel', 'İyi', 'Orta', 'Kötü',
];

export const PLATFORMS = [
  'Dolap', 'Sahibinden', 'Letgo', 'eBay', 'Vinted',
  'Instagram', 'WhatsApp', 'Depop', 'StockX', 'GOAT',
  'Facebook Marketplace', 'Twitter/X', 'Tiktok Shop', 'Mercari',
  'Diğer',
];

export const PAYMENT_METHODS = [
  'IBAN', 'Nakit', 'Papara', 'Havale',
  'PayPal', 'Payoneer', 'Stripe', 'Platform',
  'Diğer',
];

export const SEASONS = (() => {
  const seasons = [];
  for (let y = 2030; y >= 1900; y--) {
    seasons.push(`${y}/${String(y + 1).slice(2)}`);
  }
  return seasons;
})();

export const PATCH_TYPES = [
  'uefa-champions-league', 'uefa-europa-league', 'uefa-conference-league',
  'premier-league', 'la-liga', 'bundesliga', 'serie-a', 'ligue-1', 'super-lig',
  'cup', 'player-season', 'retro', 'sponsor', 'club', 'national-team', 'other',
];

export const SETTINGS_CONTACT_PLATFORMS = [
  'WhatsApp', 'Instagram', 'eBay', 'Depop', 'Dolap',
  'Vinted', 'Facebook', 'Twitter', 'TikTok',
];

export const API_BASE = import.meta.env.VITE_API_URL || '/api';
