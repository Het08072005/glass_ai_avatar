// utils/smartSearch.ts
// Client-side search query parser for displaying detected filters

export interface SmartSearchResult {
  products: any[];
  appliedFilters: {
    priceRange?: [number, number];
    genders?: string[];
    colors?: string[];
    occasions?: string[];
    sizes?: string[];
    keywords?: string[];
  };
  parsedQuery: {
    keywords: string[];
    filters: any;
  };
}

const STOP_WORDS = new Set([
  "show", "me", "find", "i", "want", "to", "buy", "looking", "for",
  "a", "an", "the", "some", "please", "get", "shoes", "shoe", "pair", "hey", "cool"
]);

const COLORS = [
  "red", "blue", "black", "white", "green", "yellow",
  "grey", "gray", "brown", "pink", "orange", "purple", "beige", "navy", "silver", "gold", "teal", "multi", "volt"
];

const OCCASIONS = [
  "casual", "sports", "sport", "formal", "party", "running", "gym", "office", "sneakers", "wedding"
];

const GENDERS = {
  "male": "male", "men": "male", "man": "male",
  "female": "female", "women": "female", "woman": "female",
  "kids": "kids", "unisex": "unisex"
};

export function smartSearch(query: string, products: any[]): SmartSearchResult {
  const appliedFilters: any = {};
  let text = query.toLowerCase().trim();

  // Extract price range
  const priceMatch = extractPrice(text);
  if (priceMatch.min || priceMatch.max) {
    appliedFilters.priceRange = [priceMatch.min || 0, priceMatch.max || 20000];
    text = text.replace(priceMatch.fullText, "");
  }

  // Extract gender - with word boundaries
  const genders: string[] = [];
  for (const [word, gender] of Object.entries(GENDERS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    if (regex.test(text)) {
      if (!genders.includes(gender)) {
        genders.push(gender);
      }
      text = text.replace(regex, "");
    }
  }
  if (genders.length > 0) appliedFilters.gender = genders;

  // Extract colors
  const colors: string[] = [];
  for (const color of COLORS) {
    if (text.includes(color)) {
      colors.push(color);
      text = text.replace(new RegExp(`\\b${color}\\b`, 'g'), "");
    }
  }
  if (colors.length > 0) appliedFilters.colors = colors;

  // Extract occasions
  const occasions: string[] = [];
  for (const occasion of OCCASIONS) {
    if (text.includes(occasion)) {
      occasions.push(occasion);
      text = text.replace(new RegExp(`\\b${occasion}\\b`, 'g'), "");
    }
  }
  if (occasions.length > 0) appliedFilters.occasions = occasions;

  // Extract sizes
  const sizes: string[] = [];
  const sizeMatches = text.match(/(?:size|uk|us|eu|no|number)\s*(\d+)/gi);
  if (sizeMatches) {
    sizeMatches.forEach(match => {
      const num = match.match(/\d+/);
      if (num) {
        sizes.push(num[0]);
        text = text.replace(match, "");
      }
    });
  }
  if (sizes.length > 0) appliedFilters.sizes = sizes;

  // Extract keywords (brands, models)
  const keywords: string[] = [];
  const words = text.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  keywords.push(...words);
  if (keywords.length > 0) appliedFilters.keywords = keywords;

  // Filter products based on detected filters
  let filtered = [...products];

  if (appliedFilters.priceRange) {
    const [min, max] = appliedFilters.priceRange;
    filtered = filtered.filter(p => p.price >= (min * 100) && p.price <= (max * 100));
  }

  if (appliedFilters.gender) {
    filtered = filtered.filter(p =>
      appliedFilters.gender.some((g: string) =>
        p.gender?.toLowerCase() === g.toLowerCase()
      )
    );
  }

  if (appliedFilters.colors) {
    filtered = filtered.filter(p => appliedFilters.colors.some((c: string) =>
      p.colors?.some((color: string) => color.toLowerCase().includes(c.toLowerCase()))
    ));
  }

  if (appliedFilters.occasions) {
    filtered = filtered.filter(p => appliedFilters.occasions.some((o: string) =>
      p.occasions?.includes(o)
    ));
  }

  if (appliedFilters.sizes) {
    filtered = filtered.filter(p => appliedFilters.sizes.some((s: string) =>
      p.sizes?.includes(s)
    ));
  }

  if (keywords.length > 0) {
    filtered = filtered.filter(p =>
      keywords.some(kw =>
        p.name?.toLowerCase().includes(kw.toLowerCase()) ||
        p.brand?.toLowerCase().includes(kw.toLowerCase()) ||
        p.description?.toLowerCase().includes(kw.toLowerCase())
      )
    );
  }

  return {
    products: filtered,
    appliedFilters,
    parsedQuery: {
      keywords,
      filters: appliedFilters
    }
  };
}

function extractPrice(text: string): { min?: number; max?: number; fullText: string } {
  let fullText = "";
  let min: number | undefined;
  let max: number | undefined;

  // "5k", "under 5k", "5000-10000" etc.
  const patterns = [
    /between\s*(\d+k?)\s*(?:and|to|-)\s*(\d+k?)/i,
    /under\s*(\d+k?)/i,
    /below\s*(\d+k?)/i,
    /upto\s*(\d+k?)/i,
    /above\s*(\d+k?)/i,
    /over\s*(\d+k?)/i,
    /(\d+k?)\s*(?:to|-)\s*(\d+k?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      fullText = match[0];
      if (match[1]) {
        const val1 = parsePrice(match[1]);
        if (pattern.toString().includes("under") || pattern.toString().includes("below") || pattern.toString().includes("upto")) {
          max = val1;
        } else if (pattern.toString().includes("above") || pattern.toString().includes("over")) {
          min = val1;
        } else if (match[2]) {
          min = val1;
          max = parsePrice(match[2]);
        }
      }
      break;
    }
  }

  return { min, max, fullText };
}

function parsePrice(priceStr: string): number {
  const num = parseFloat(priceStr.replace(/[^\d.]/g, ""));
  if (priceStr.toLowerCase().includes("k")) {
    return num * 1000;
  }
  return num;
}
