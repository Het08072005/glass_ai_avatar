import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>😕</div>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#2c3e50' }}>
        404 - Page Not Found
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
        Sorry, the page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          padding: '0.8rem 2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
