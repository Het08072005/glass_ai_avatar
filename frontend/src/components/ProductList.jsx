import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import ProductCard from './ProductCard';
import '../styles/Products.css';

const ProductList = ({ selectedCategory, minPrice, maxPrice }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedCategory && selectedCategory !== 'all') {
          params.category = selectedCategory;
        }
        if (minPrice) {
          params.min_price = minPrice;
        }
        if (maxPrice) {
          params.max_price = maxPrice;
        }

        // Use /all endpoint to get all products
        const response = await axios.get('/all', { params });
        setProducts(response.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch products. Please try again.');
        setProducts([]);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, minPrice, maxPrice]);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (products.length === 0) {
    return <div className="empty-state">No products found. Try adjusting your filters.</div>;
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;