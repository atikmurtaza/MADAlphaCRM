'use client';

import React from 'react';
import { createPortal } from 'react-dom';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: string | null;
  description: string | null;
}

export function ProductModal({ isOpen, onClose, product, description }: ProductModalProps) {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}
    >
      <div 
        className="card" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: '90%', maxWidth: '500px',
          maxHeight: '90vh', overflowY: 'auto', position: 'relative',
          backgroundColor: 'var(--bg-card)',
          padding: '2rem'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}
        >
          &times;
        </button>
        
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.5rem' }}>
          {product || 'Unknown Product'}
        </h2>
        
        <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
          {description ? description : 'No description provided.'}
        </div>
      </div>
    </div>,
    document.body
  );
}
