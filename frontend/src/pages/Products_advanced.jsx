import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "../api/axios";
import "../styles/Products.css";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [sortBy, setSortBy] = useState("popular");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    gender: true,
    price: true,
    colors: false,
    sizes: false,
    occasions: false,
  });
  const [showFilters, setShowFilters] = useState(true);

  const debounceTimer = useRef(null);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/all");
        setAllProducts(response.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Extract unique values
  const genders = useMemo(() => {
    const unique = [
      ...new Set(allProducts.map((p) => p.gender).filter(Boolean)),
    ];
    return unique.sort();
  }, [allProducts]);

  const colors = useMemo(() => {
    const unique = [...new Set(allProducts.flatMap((p) => p.colors || []))];
    return unique.sort();
  }, [allProducts]);

  const sizes = useMemo(() => {
    const unique = [...new Set(allProducts.flatMap((p) => p.sizes || []))];
    return unique.sort((a, b) => Number(a) - Number(b));
  }, [allProducts]);

  const occasions = useMemo(() => {
    const unique = [...new Set(allProducts.flatMap((p) => p.occasions || []))];
    return unique.sort();
  }, [allProducts]);

  // Handle smart search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchResults(null); // Clear previous results immediately
      const response = await axios.get("/smart-search", {
        params: { q: query },
      });

      if (response.data) {
        setSearchResults({
          products: response.data.products || [],
          appliedFilters: response.data.appliedFilters || {},
        });
      } else {
        setSearchResults({ products: [], appliedFilters: {} });
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({ products: [], appliedFilters: {} });
    } finally {
      setSearchLoading(false);
    }
  };

  // Filter products based on UI selections
  const filteredProducts = useMemo(() => {
    let filtered = searchResults ? searchResults.products : allProducts;

    // Gender filter
    if (selectedGenders.length > 0) {
      filtered = filtered.filter((p) =>
        selectedGenders.some(
          (g) => p.gender?.toLowerCase() === g.toLowerCase(),
        ),
      );
    }

    // Price filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1],
    );

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((p) =>
        selectedColors.some((c) => p.colors?.includes(c)),
      );
    }

    // Size filter
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        selectedSizes.some((s) => p.sizes?.includes(s)),
      );
    }

    // Occasion filter
    if (selectedOccasions.length > 0) {
      filtered = filtered.filter((p) =>
        selectedOccasions.some((o) => p.occasions?.includes(o)),
      );
    }

    // Sorting
    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [
    searchResults,
    allProducts,
    selectedGenders,
    selectedColors,
    selectedSizes,
    selectedOccasions,
    priceRange,
    sortBy,
  ]);

  const toggleFilter = (value, array, setArray) => {
    if (array.includes(value)) {
      setArray(array.filter((v) => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAllFilters = () => {
    setSelectedGenders([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedOccasions([]);
    setPriceRange([0, 20000]);
    setSearchQuery("");
    setSearchResults(null);
  };

  const activeFiltersCount =
    selectedGenders.length +
    selectedColors.length +
    selectedSizes.length +
    selectedOccasions.length;

  // Detected filters from smart search
  const detectedFilters = searchResults?.appliedFilters || {};

  return (
    <div className="products-container">
      {/* Header */}
      <div className="products-header-top">
        <h1>Premium Shoes Collection</h1>
      </div>

      {/* Smart Search Bar */}
      <div className="smart-search-wrapper">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Try: 'nike black shoes under 10k', 'casual women shoes', 'running size 10'..."
            value={searchQuery}
            onChange={(e) => {
              const newValue = e.target.value;
              setSearchQuery(newValue);

              // Clear existing debounce timer
              if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
              }

              // Set new debounce timer
              if (newValue.trim()) {
                debounceTimer.current = setTimeout(() => {
                  handleSearch(newValue);
                }, 300); // Wait 300ms after user stops typing
              } else {
                setSearchResults(null);
              }
            }}
            className="smart-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
                if (debounceTimer.current) {
                  clearTimeout(debounceTimer.current);
                }
              }}
              className="clear-search-btn"
            >
              ✕
            </button>
          )}
        </div>

        {/* Detected Filters Tags */}
        {searchResults && Object.keys(detectedFilters).length > 0 && (
          <div className="detected-filters">
            <span className="filter-label">Smart filters detected:</span>
            <div className="filter-tags">
              {detectedFilters.priceRange && (
                <span className="filter-tag price-tag">
                  ₹{detectedFilters.priceRange[0].toLocaleString()} - ₹
                  {detectedFilters.priceRange[1].toLocaleString()}
                </span>
              )}
              {detectedFilters.gender?.map((g) => (
                <span key={g} className="filter-tag gender-tag">
                  {g}
                </span>
              ))}
              {detectedFilters.colors?.map((c) => (
                <span key={c} className="filter-tag color-tag">
                  {c}
                </span>
              ))}
              {detectedFilters.sizes?.map((s) => (
                <span key={s} className="filter-tag size-tag">
                  Size {s}
                </span>
              ))}
              {detectedFilters.occasions?.map((o) => (
                <span key={o} className="filter-tag occasion-tag">
                  {o}
                </span>
              ))}
              {detectedFilters.keywords?.map((k) => (
                <span key={k} className="filter-tag keyword-tag">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="products-layout">
        {/* Filters Sidebar */}
        <aside className={`filters-sidebar ${showFilters ? "open" : "closed"}`}>
          <div className="filters-header">
            <h2>Filters</h2>
            {activeFiltersCount > 0 && (
              <button onClick={clearAllFilters} className="clear-all-btn">
                Clear All ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Gender Filter */}
          <div className="filter-section">
            <button
              className="filter-title"
              onClick={() => toggleSection("gender")}
            >
              <span>Gender</span>
              <span className="toggle-icon">
                {expandedSections.gender ? "−" : "+"}
              </span>
            </button>
            {expandedSections.gender && (
              <div className="filter-options">
                {genders.map((gender) => (
                  <label key={gender} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedGenders.includes(gender)}
                      onChange={() =>
                        toggleFilter(
                          gender,
                          selectedGenders,
                          setSelectedGenders,
                        )
                      }
                    />
                    <span>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Filter */}
          <div className="filter-section">
            <button
              className="filter-title"
              onClick={() => toggleSection("price")}
            >
              <span>Price Range</span>
              <span className="toggle-icon">
                {expandedSections.price ? "−" : "+"}
              </span>
            </button>
            {expandedSections.price && (
              <div className="price-filter">
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    className="price-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="price-input"
                  />
                </div>
                <p className="price-display">
                  ₹{priceRange[0].toLocaleString()} - ₹
                  {priceRange[1].toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Colors Filter */}
          <div className="filter-section">
            <button
              className="filter-title"
              onClick={() => toggleSection("colors")}
            >
              <span>Colors</span>
              <span className="toggle-icon">
                {expandedSections.colors ? "−" : "+"}
              </span>
            </button>
            {expandedSections.colors && (
              <div className="filter-options colors-grid">
                {colors.map((color) => (
                  <label key={color} className="filter-option color-option">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color)}
                      onChange={() =>
                        toggleFilter(color, selectedColors, setSelectedColors)
                      }
                    />
                    <span className="color-name">{color}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sizes Filter */}
          <div className="filter-section">
            <button
              className="filter-title"
              onClick={() => toggleSection("sizes")}
            >
              <span>Sizes</span>
              <span className="toggle-icon">
                {expandedSections.sizes ? "−" : "+"}
              </span>
            </button>
            {expandedSections.sizes && (
              <div className="sizes-grid">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      toggleFilter(size, selectedSizes, setSelectedSizes)
                    }
                    className={`size-btn ${selectedSizes.includes(size) ? "active" : ""}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Occasions Filter */}
          <div className="filter-section">
            <button
              className="filter-title"
              onClick={() => toggleSection("occasions")}
            >
              <span>Occasions</span>
              <span className="toggle-icon">
                {expandedSections.occasions ? "−" : "+"}
              </span>
            </button>
            {expandedSections.occasions && (
              <div className="filter-options">
                {occasions.map((occasion) => (
                  <label key={occasion} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedOccasions.includes(occasion)}
                      onChange={() =>
                        toggleFilter(
                          occasion,
                          selectedOccasions,
                          setSelectedOccasions,
                        )
                      }
                    />
                    <span>
                      {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="products-main">
          <div className="products-toolbar">
            <div className="results-info">
              <p>
                Showing <strong>{filteredProducts.length}</strong> products
                {activeFiltersCount > 0 &&
                  ` with ${activeFiltersCount} filter(s)`}
              </p>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-state">Loading products...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} />
                    ) : (
                      <div className="placeholder">👟</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="brand">{product.brand}</p>
                    {product.gender && (
                      <p className="gender">{product.gender}</p>
                    )}
                    <p className="price">₹{product.price.toLocaleString()}</p>
                    {product.sizes?.length > 0 && (
                      <p className="sizes">Sizes: {product.sizes.join(", ")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search query</p>
              <button onClick={clearAllFilters} className="reset-btn">
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
