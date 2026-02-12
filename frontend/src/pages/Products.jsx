import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import ProductCard from '../components/ProductCard';

const BRAND_LIST = [
  "Adidas", "Akoni", "Alexander McQueen", "All Saints", "Arnette", "Balenciaga", "BALMAIN",
  "Bolle", "Boss", "Bottega Veneta", "Burberry", "Burberry Kids", "Calvin Klein",
  "Calvin Klein Jeans", "Canada Goose", "Carolina Herrera", "Carrera", "Carrera Ducati",
  "Chloé", "Chloé Kids", "Chopard", "Coach", "Cutler and Gross", "David Beckham", "Dita",
  "DKNY", "Dolce&Gabbana", "DSQUARED2", "Emporio Armani", "EYEVAN", "Facecandie",
  "Ferragamo", "Ferrari", "Gucci", "Guess", "HUGO", "Jacquemus", "Jimmy Choo",
  "Kate Spade New York", "Lacoste", "Linda Farrow", "Longchamp", "Love Moschino",
  "Marc Jacobs", "MaxMara", "Michael Kors", "Moncler", "Montblanc", "Moschino", "Mulberry",
  "MYKITA", "Nike", "Nike Kids", "Oakley", "Off-White", "Oliver Peoples", "Palm Angels",
  "Paul Smith", "Persol", "Philipp Plein", "Polaroid", "Polaroid Kids", "Police",
  "Polo Ralph Lauren", "Polo Ralph Lauren Kids", "Porsche Design", "Ralph By Ralph Lauren",
  "Ray-Ban", "Ray-Ban for Scuderia Ferrari", "Ray-Ban Kids", "Revo", "Rudy Project",
  "Saint Laurent", "Scuderia Ferrari", "Serengeti", "Swarovski", "Tiffany & Co", "Tom Ford",
  "Tommy Hilfiger", "Under Armour", "Valentino", "Versace", "Versace Kids",
  "Victoria Beckham", "Vivienne Westwood", "Vogue Eyewear", "Zeiss"
];

const PRICE_RANGES = [
  { label: "Under $67.95", min: 0, max: 67.95 },
  { label: "$67.95 to $135.89", min: 67.95, max: 135.89 },
  { label: "$135.89 to $339.73", min: 135.89, max: 339.73 },
  { label: "$339.73 to $679.46", min: 339.73, max: 679.46 },
  { label: "Over $679.46", min: 679.46, max: '' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category')?.split(',') || []);
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand')?.split(',') || []);
  const [faceShape, setFaceShape] = useState(searchParams.get('face_shape')?.split(',') || []);
  const [frameShape, setFrameShape] = useState(searchParams.get('frame_shape')?.split(',') || []);
  const [occasion, setOccasion] = useState(searchParams.get('occasion')?.split(',') || []);
  const [frameColor, setFrameColor] = useState(searchParams.get('frame_color')?.split(',') || []);
  const [lensColor, setLensColor] = useState(searchParams.get('lens_color')?.split(',') || []);
  const [lensShape, setLensShape] = useState(searchParams.get('lens_shape')?.split(',') || []);
  const [usage, setUsage] = useState(searchParams.get('usage')?.split(',') || []);
  const [armSize, setArmSize] = useState(searchParams.get('arm_size')?.split(',') || []);
  const [lensSize, setLensSize] = useState(searchParams.get('lens_size')?.split(',') || []);
  const [bridgeSize, setBridgeSize] = useState(searchParams.get('bridge_size')?.split(',') || []);
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [sortBy, setSortBy] = useState('popular');

  // Search State
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [allProducts, setAllProducts] = useState([]);
  const [facets, setFacets] = useState({
    brands: [],
    categories: [],
    genders: [],
    face_shapes: ["oval", "round", "heart", "square", "diamond", "oblong"],
    frame_shapes: ["rectangular", "aviator", "wayfarer", "round", "cat-eye", "oval", "square", "oversized", "geometric"],
    occasions: ["formal", "casual", "beach", "party", "sports", "office", "travel", "wedding"],
    frame_colors: [], lens_colors: [], lens_shapes: [], usages: [], arm_sizes: [], lens_sizes: [], bridge_sizes: []
  });
  const [loading, setLoading] = useState(true); // 🔥 Initial true to prevent Flicker
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [wsDataApplied, setWsDataApplied] = useState(false); // 🔥 Prevent overwriting AI results

  const inputRef = useRef(null);
  const observer = useRef();
  const isFromWS = useRef(false);
  const lastPushedQuery = useRef(searchParams.get('q') || '');

  // Sync search input from URL - Handling navigation/back-button updates
  useEffect(() => {
    const q = searchParams.get('q') || '';
    // If the URL query is different from what we last pushed, it means it's an external change (Nav, Back Btn)
    // So we must sync the input to match it.
    // ALSO: strictly DO NOT sync if the user is currently focused on the input (typing/pasting)
    if (q !== lastPushedQuery.current && document.activeElement !== inputRef.current) {
      setSearchInput(q);
      lastPushedQuery.current = q;
    }
  }, [searchParams.get('q')]);

  const fetchFacets = async () => {
    try {
      const resp = await axios.get('/facets');
      setFacets(prev => ({ ...prev, ...resp.data }));
    } catch (err) { console.error(err); }
  };

  const performSearch = async (isAppend = false) => {
    // 🔥 If we just applied AI results via WS, skip the first automatic fetch to prevent overwrite
    if (!isAppend && wsDataApplied) {
      console.log("Skipping fetch: AI results already present.");
      setWsDataApplied(false);
      return;
    }

    try {
      if (!isAppend) setLoading(true);
      const query = searchInput.trim();
      const currentSkip = isAppend ? skip : 0;
      const endpoint = query ? '/search' : '/all';

      const params = {
        skip: currentSkip,
        limit: 20,
        q: query || undefined,
        brand: selectedBrand.length ? selectedBrand.join(',') : undefined,
        category: selectedCategory.length ? selectedCategory.join(',') : undefined,
        face_shape: faceShape.length ? faceShape.join(',') : undefined,
        frame_shape: frameShape.length ? frameShape.join(',') : undefined,
        occasion: occasion.length ? occasion.join(',') : undefined,
        frame_color: frameColor.length ? frameColor.join(',') : undefined,
        lens_color: lensColor.length ? lensColor.join(',') : undefined,
        lens_shape: lensShape.length ? lensShape.join(',') : undefined,
        usage: usage.length ? usage.join(',') : undefined,
        arm_size: armSize.length ? armSize.join(',') : undefined,
        lens_size: lensSize.length ? lensSize.join(',') : undefined,
        bridge_size: bridgeSize.length ? bridgeSize.join(',') : undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
      };

      const response = await axios.get(endpoint, { params });
      const data = response.data || [];

      if (isAppend) setAllProducts(prev => [...prev, ...data]);
      else setAllProducts(data);

      setHasMore(data.length === 20);

      // Update URL to match current state
      const urlParams = {};
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && k !== 'skip' && k !== 'limit') urlParams[k] = v;
      });

      lastPushedQuery.current = query;
      setSearchParams(urlParams, { replace: true });

    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      if (!isAppend) setLoading(false);
    }
  };

  // 1. Initial Load & Facets
  useEffect(() => {
    fetchFacets();
  }, []);

  // 2. Immediate Fetch for Filter Changes & Initial Load
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      // 🔥 If we have search params or it's the very first visit, we MUST fetch.
      // But we skip if WS data already arrived (AI Agent scenario).
      if (!wsDataApplied && !window.lastWSSearchResult) {
        performSearch(false);
      }
      return;
    }
    setSkip(0);
    performSearch(false);
  }, [selectedCategory, selectedBrand, faceShape, frameShape, occasion, frameColor, lensColor, lensShape, usage, armSize, lensSize, bridgeSize, minPrice, maxPrice]);

  // 3. Debounced Fetch for Search Input (Typing)
  useEffect(() => {
    // Skip if searchInput matches URL (prevents loop on initial/back nav)
    if (searchInput === (searchParams.get('q') || '')) return;

    const timer = setTimeout(() => {
      setSkip(0);
      performSearch(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 4. Infinity Scroll Fetch
  useEffect(() => {
    if (skip > 0) performSearch(true);
  }, [skip]);

  const lastProductElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setSkip(prev => prev + 20);
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Sync state back from URL - For navigation events (Back/Forward)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== lastPushedQuery.current && document.activeElement !== inputRef.current) {
      setSearchInput(q);
      lastPushedQuery.current = q;
    }

    // Helper to get array from param
    const getArr = (key) => searchParams.get(key)?.split(',').filter(Boolean) || [];

    // Strictly sync states only if they differ from URL (Prevents cycles)
    const b = getArr('brand');
    if (JSON.stringify(b) !== JSON.stringify(selectedBrand)) setSelectedBrand(b);

    const c = getArr('category');
    if (JSON.stringify(c) !== JSON.stringify(selectedCategory)) setSelectedCategory(c);

    const f = getArr('face_shape');
    if (JSON.stringify(f) !== JSON.stringify(faceShape)) setFaceShape(f);

    const fs = getArr('frame_shape');
    if (JSON.stringify(fs) !== JSON.stringify(frameShape)) setFrameShape(fs);

    const o = getArr('occasion');
    if (JSON.stringify(o) !== JSON.stringify(occasion)) setOccasion(o);

    const fc = getArr('frame_color');
    if (JSON.stringify(fc) !== JSON.stringify(frameColor)) setFrameColor(fc);

    const lc = getArr('lens_color');
    if (JSON.stringify(lc) !== JSON.stringify(lensColor)) setLensColor(lc);

    const ls = getArr('lens_shape');
    if (JSON.stringify(ls) !== JSON.stringify(lensShape)) setLensShape(ls);

    const u = getArr('usage');
    if (JSON.stringify(u) !== JSON.stringify(usage)) setUsage(u);

    const as = getArr('arm_size');
    if (JSON.stringify(as) !== JSON.stringify(armSize)) setArmSize(as);

    const lsz = getArr('lens_size');
    if (JSON.stringify(lsz) !== JSON.stringify(lensSize)) setLensSize(lsz);

    const bsz = getArr('bridge_size');
    if (JSON.stringify(bsz) !== JSON.stringify(bridgeSize)) setBridgeSize(bsz);

    const minp = searchParams.get('min_price') || '';
    if (minp !== minPrice) setMinPrice(minp);

    const maxp = searchParams.get('max_price') || '';
    if (maxp !== maxPrice) setMaxPrice(maxp);

  }, [searchParams]);

  // Handle Search Input Change
  const onSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Immediate search on submit (Enter key or button click)
    const updatedParams = Object.fromEntries(searchParams.entries());
    const val = searchInput.trim();
    if (val) updatedParams.q = val;
    else delete updatedParams.q;

    lastPushedQuery.current = val;
    setSearchParams(updatedParams, { replace: true });
  };

  // Listen for Global WebSocket Searches (AI Agent Integration)
  useEffect(() => {
    const handleWSResult = (event) => {
      // If user is typing, ignore incoming WS search overrides to prevent interruptions
      if (document.activeElement === inputRef.current) return;

      const data = event.detail;
      if (data.products) {
        console.log("Applying AI search results from WebSocket...");
        isFromWS.current = true;
        setWsDataApplied(true); // 🔥 Lock next automated fetch
        setSearchInput(data.query || '');
        setAllProducts(data.products);
        setHasMore(false);
        setSkip(0);
        setLoading(false); // Stop any pending skeleton

        const currentParams = Object.fromEntries(searchParams.entries());
        if (data.query) currentParams.q = data.query;
        else delete currentParams.q;

        lastPushedQuery.current = data.query || '';
        setSearchParams(currentParams, { replace: true });
      }
    };

    const handleWSLoading = () => {
      setLoading(true);
      setAllProducts([]);
    };

    window.addEventListener("ws-search-result", handleWSResult);
    window.addEventListener("ws-search-loading", handleWSLoading);

    if (window.lastWSSearchResult) {
      handleWSResult({ detail: window.lastWSSearchResult });
      window.lastWSSearchResult = null;
    }
    return () => {
      window.removeEventListener("ws-search-result", handleWSResult);
      window.removeEventListener("ws-search-loading", handleWSLoading);
    };
  }, [searchParams, setSearchParams]);

  const handleClear = () => {
    setSelectedBrand([]);
    setSelectedCategory([]);
    setFaceShape([]);
    setFrameShape([]);
    setOccasion([]);
    setFrameColor([]);
    setLensColor([]);
    setLensShape([]);
    setUsage([]);
    setArmSize([]);
    setLensSize([]);
    setBridgeSize([]);
    setMinPrice('');
    setMaxPrice('');
    setSearchInput('');
    setSearchParams({});
    setLoading(true);
  };

  const toggleFilter = (list, item, setter) => {
    if (item === 'all') {
      setter([]);
      return;
    }
    const newList = list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
    setter(newList);
  };

  return (
    <div className="min-h-screen bg-[#050505] py-6 sm:py-12">
      <div className="max-w-[1540px] mx-auto px-4 sm:px-6">

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-12">

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full bg-white/[0.02] border border-white/10 rounded-2xl py-3 px-6 text-sm text-white flex items-center justify-between hover:bg-white/[0.05] transition-all"
          >
            <span className="uppercase tracking-widest">Filters</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showFilters ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 6h18M7 12h10M10 18h4" />}
            </svg>
          </button>

          {/* Sidebar - Left side */}
          <aside className={`w-full lg:w-64 xl:w-72 shrink-0 space-y-12 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="p-6 sm:p-8 glass bg-white/[0.02] rounded-3xl lg:sticky lg:top-32 border border-white/5 max-h-[calc(100vh-9rem)] overflow-y-auto scrollbar-hide overscroll-contain">
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                <h2 className="text-lg sm:text-xl font-serif text-white uppercase tracking-widest">Filters</h2>
                <button onClick={handleClear} className="text-[#c5a059] text-[10px] uppercase tracking-widest hover:underline">Reset</button>
              </div>

              <div className="space-y-10">
                {/* Dynamic Brand List */}
                <div>
                  <h3 className="text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Brand</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {facets.brands.map(brand => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedBrand.includes(brand)}
                            onChange={() => toggleFilter(selectedBrand, brand, setSelectedBrand)}
                            className="appearance-none w-3 h-3 border border-white/20 bg-transparent checked:bg-[#c5a059] checked:border-[#c5a059] rounded-none transition-all"
                          />
                          {selectedBrand.includes(brand) && (
                            <svg className="w-2 h-2 text-black absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest transition-colors truncate ${selectedBrand.includes(brand) ? 'text-white font-bold' : 'text-white/40 group-hover:text-white'}`}>{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Face Shape */}
                <div>
                  <h3 className="text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Face Silhouette</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {facets.face_shapes.map(s => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            checked={faceShape.includes(s)}
                            onChange={() => toggleFilter(faceShape, s, setFaceShape)}
                            className="appearance-none w-3 h-3 border border-white/20 bg-transparent checked:bg-[#c5a059] checked:border-[#c5a059] rounded-none transition-all"
                          />
                          {faceShape.includes(s) && (
                            <svg className="w-2 h-2 text-black absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest transition-colors truncate ${faceShape.includes(s) ? 'text-white font-bold' : 'text-white/40 group-hover:text-white'}`}>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Price Tier</h3>
                  <div className="space-y-3 mb-6 custom-scrollbar overflow-y-auto max-h-60">
                    {PRICE_RANGES.map((range, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center shrink-0">
                          <input
                            type="radio"
                            name="price_range"
                            checked={parseFloat(minPrice) === range.min && (range.max === '' ? maxPrice === '' : parseFloat(maxPrice) === range.max)}
                            onClick={(e) => {
                              if (parseFloat(minPrice) === range.min && (range.max === '' ? maxPrice === '' : parseFloat(maxPrice) === range.max)) {
                                e.preventDefault();
                                setMinPrice('');
                                setMaxPrice('');
                              } else {
                                setMinPrice(range.min);
                                setMaxPrice(range.max);
                              }
                            }}
                            onChange={() => { }}
                            className="appearance-none w-3 h-3 border border-white/20 bg-transparent checked:bg-[#c5a059] checked:border-[#c5a059] rounded-none transition-all"
                          />
                          {(parseFloat(minPrice) === range.min && (range.max === '' ? maxPrice === '' : parseFloat(maxPrice) === range.max)) && (
                            <svg className="w-2 h-2 text-black absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest transition-colors ${parseFloat(minPrice) === range.min ? 'text-white font-bold' : 'text-white/40 group-hover:text-white'}`}>
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {/* Manual Inputs Fallback */}
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-1/2 bg-white/5 border border-white/10 p-3 text-[12px] text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-1/2 bg-white/5 border border-white/10 p-3 text-[12px] text-white"
                    />
                  </div>
                </div>

                {/* Dynamic Facet Sections */}
                {/* Helper for rendering checkbox grids */}
                {[
                  { title: "Frame Colour", items: facets.frame_colors, state: frameColor, setter: setFrameColor },
                  { title: "Lens Colour", items: facets.lens_colors, state: lensColor, setter: setLensColor },
                  { title: "Lens Shape", items: facets.lens_shapes, state: lensShape, setter: setLensShape },
                  { title: "Lens Purpose", items: facets.usages, state: usage, setter: setUsage },
                  { title: "Arm Size", items: facets.arm_sizes, state: armSize, setter: setArmSize },
                  { title: "Lens Size", items: facets.lens_sizes, state: lensSize, setter: setLensSize },
                  { title: "Bridge Size", items: facets.bridge_sizes, state: bridgeSize, setter: setBridgeSize },
                ].map((section) => (
                  section.items && section.items.length > 0 && (
                    <div key={section.title}>
                      <h3 className="text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-bold mb-4">{section.title}</h3>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {section.items.map(item => (
                          <label key={item} className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center justify-center shrink-0">
                              <input
                                type="checkbox"
                                checked={section.state.includes(item.toString())}
                                onChange={() => toggleFilter(section.state, item.toString(), section.setter)}
                                className="appearance-none w-3 h-3 border border-white/20 bg-transparent checked:bg-[#c5a059] checked:border-[#c5a059] rounded-none transition-all"
                              />
                              {section.state.includes(item.toString()) && (
                                <svg className="w-2 h-2 text-black absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-[10px] uppercase tracking-widest transition-colors truncate ${section.state.includes(item.toString()) ? 'text-white font-bold' : 'text-white/40 group-hover:text-white'}`}>
                              {item}{section.title.includes("Size") ? "mm" : ""}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                ))}

              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <main className="flex-1">
            {/* Search Bar - High-Performance Sync */}
            <div className="mb-8 sm:mb-12 flex flex-col gap-4 sm:gap-8 items-stretch sm:items-center sm:flex-row justify-between border-b border-white/5 pb-6 sm:pb-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-2xl group">
                <input
                  type="text"
                  placeholder="Search the archive..."
                  value={searchInput}
                  onChange={onSearchChange}
                  ref={inputRef}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-4 px-6 sm:px-8 pr-12 sm:pr-16 text-base sm:text-lg font-light text-white focus:outline-none focus:border-[#c5a059]/50 transition-all hover:bg-white/[0.08]"
                />
                <button type="submit" className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-[#c5a059]/40 group-focus-within:text-[#c5a059] transition-colors hover:text-[#c5a059] cursor-pointer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </button>
              </form>

              <div className="flex gap-4 sm:gap-8 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold shrink-0 overflow-x-auto">
                {['Popularity', 'Price: Low-High', 'Price: High-Low'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`pb-1 border-b transition-all whitespace-nowrap ${sortBy === s ? 'text-[#c5a059] border-[#c5a059]' : 'text-white/20 border-transparent hover:text-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading && allProducts.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex flex-col h-full space-y-3 sm:space-y-4">
                    <div className="aspect-[16/10] bg-white/5 animate-pulse rounded-2xl sm:rounded-3xl w-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />
                    </div>
                    <div className="h-3 sm:h-4 bg-white/5 animate-pulse rounded w-1/3" />
                    <div className="h-3 sm:h-4 bg-white/5 animate-pulse rounded w-2/3" />
                    <div className="mt-auto pt-3 sm:pt-4 border-t border-white/5 flex justify-between">
                      <div className="h-3 sm:h-4 bg-white/5 animate-pulse rounded w-12 sm:w-16" />
                      <div className="h-6 w-6 sm:h-8 sm:w-8 bg-white/5 animate-pulse rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : allProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {allProducts.map((product, index) => (
                  <div key={index} ref={allProducts.length === index + 1 ? lastProductElementRef : null}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : !loading ? (
              <div className="text-center py-20 sm:py-40 glass rounded-[2rem] border border-dashed border-white/10">
                <p className="text-white/30 text-xs tracking-[0.4em] uppercase mb-4 italic">
                  {searchInput || selectedBrand.length || selectedCategory.length || minPrice || maxPrice
                    ? "Specimens not found in this archive"
                    : "Fetching latest additions from the vault..."}
                </p>
                <div className="space-y-4">
                  <p className="text-white/10 text-[10px] uppercase tracking-widest">Try adjusting your filters or search query</p>
                  <button onClick={handleClear} className="text-[#c5a059] border border-[#c5a059]/30 px-6 sm:px-10 py-3 sm:py-4 text-[10px] uppercase tracking-widest hover:bg-[#c5a059] hover:text-black transition-all">Clear Search & Filters</button>
                </div>
              </div>
            ) : null}

            {hasMore && loading && <div className="py-10 sm:py-20 text-center text-[#c5a059] animate-pulse uppercase tracking-[0.5em] text-[10px]">Updating Piece Registry</div>}
          </main>

        </div>
      </div>
    </div>
  );
};

export default Products;
