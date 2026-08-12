'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getClientHistory } from '../app/actions/client';
import { SalesTable } from './SalesTable';

interface ClientModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  isLeader?: boolean;
  isExecutionManager?: boolean;
}

export function ClientModal({ clientId, isOpen, onClose, isLeader, isExecutionManager }: ClientModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && clientId) {
      setLoading(true);
      getClientHistory(clientId).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [isOpen, clientId]);

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
          width: '90%', maxWidth: '1200px', maxHeight: '90vh', 
          overflowY: 'auto', position: 'relative',
          backgroundColor: 'var(--bg-card)' 
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}
        >
          &times;
        </button>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading client history...</div>
        ) : !data ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Client not found</div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>{data.client.name}</h2>
            
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div>
                <strong className="text-secondary" style={{ fontSize: '0.8rem' }}>Email:</strong>
                <div>{data.client.email || '-'}</div>
              </div>
              <div>
                <strong className="text-secondary" style={{ fontSize: '0.8rem' }}>Phone:</strong>
                <div>{data.client.phone || '-'}</div>
              </div>
              {/* Note: since clientSocialHandle is usually stored on the sale level, let's grab the unique social handles from the sales */}
              <div>
                <strong className="text-secondary" style={{ fontSize: '0.8rem' }}>Social Handles:</strong>
                <div>
                  {Array.from(new Set(data.sales.map((s: any) => s.clientSocialHandle).filter(Boolean))).join(', ') || '-'}
                </div>
              </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Historic Sales</h3>
            <SalesTable 
              sales={data.sales} 
              isLeader={isLeader} 
              isExecutionManager={isExecutionManager} 
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
