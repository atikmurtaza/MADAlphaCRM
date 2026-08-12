import React, { useState } from 'react';
import { ClientModal } from './ClientModal';
import { ProductModal } from './ProductModal';

export interface SaleWithDetails {
  id: string;
  createdAt: Date;
  customSaleId: string | null;
  targetAmount: number;
  status: string;
  approvalStatus: string;
  product: string | null;
  productDescription: string | null;
  latestUpdate: string | null;
  client?: { id: string; name: string } | null;
  clientSocialHandle: string | null;
  agent?: { name: string } | null;
  payments?: { amount: number; recordedAt: Date }[];
  refunds?: { amount: number; recordedAt: Date }[];
  project?: { id: string; cost?: number | null; designer?: string | null; details?: string | null; assignments?: { employee?: { id: string; name: string } }[] } | null;
}

interface SalesTableProps {
  sales: SaleWithDetails[];
  isLeader?: boolean;
  isExecutionManager?: boolean;
  aems?: { id: string; name: string }[];
  onStatusChange?: (saleId: string, newStatus: string) => void;
  onUpdateChange?: (saleId: string, update: string) => void;
  onProjectUpdate?: (projectId: string, field: string, value: any) => void;
  onAssignEM?: (projectId: string, employeeId: string) => void;
}

export function SalesTable({ sales, isLeader = false, isExecutionManager = false, aems = [], onStatusChange, onUpdateChange, onProjectUpdate, onAssignEM }: SalesTableProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ name: string | null; description: string | null } | null>(null);

  return (
    <>
    <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, overflowX: 'auto' }}>
      <table style={{ fontSize: '0.75rem', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>ID</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Date</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Employee</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Total</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Cleared</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Balance</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Status</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>Cleared At</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Client</th>
            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Product</th>
            
            {isExecutionManager && (
              <>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Cost</th>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>Designer</th>
              </>
            )}

            <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', minWidth: '350px' }}>Details</th>
            
            {(isLeader || isExecutionManager) && <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>EM</th>}
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 ? (
            <tr>
              <td colSpan={15} style={{ padding: '1rem', textAlign: 'center' }} className="text-secondary">
                No sales match the filters.
              </td>
            </tr>
          ) : (
            sales.map((sale) => {
              const em = sale.project?.assignments?.[0]?.employee?.name || 'Talha';
              const p = sale.payments?.reduce((acc, val) => acc + val.amount, 0) || 0;
              const r = sale.refunds?.reduce((acc, val) => acc + val.amount, 0) || 0;
              const netCleared = Math.max(0, p - r);
              const balance = sale.targetAmount - netCleared;

              let clearanceDate = '-';
              if (sale.status === 'COMPLETED' && (sale as any).clearedAt) {
                clearanceDate = new Date((sale as any).clearedAt).toLocaleDateString();
              }

              const statusAccent: Record<string, string> = {
                IN_PROGRESS: '#2563EB',
                COMPLETED: '#0F9D58',
                DECLINED: '#B45309',
                REFUNDED: '#DC2626',
              };
              const accent = statusAccent[sale.status] || 'transparent';

              return (
                <tr key={sale.id} style={{ boxShadow: `inset 3px 0 0 ${accent}` }}>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{sale.customSaleId || '-'}</td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>{new Date(sale.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>{sale.agent?.name || '-'}</td>
                  
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>${sale.targetAmount}</td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }} className="text-success">${netCleared}</td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap', color: balance > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>${balance}</td>
                  
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                    {(isLeader || isExecutionManager) && onStatusChange ? (
                      <span className={`status-pill status-${sale.status.toLowerCase()} status-editable`}>
                        {sale.status.replace('_', ' ')}
                        <span className="status-caret">▾</span>
                        <select
                          value={sale.status}
                          onChange={e => onStatusChange(sale.id, e.target.value)}
                          aria-label="Update status"
                        >
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="DECLINED">DECLINED</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </span>
                    ) : (
                      <span className={`status-pill status-${sale.status.toLowerCase()}`}>
                        {sale.status.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>{clearanceDate}</td>
                  
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {sale.client?.id ? (
                      <button 
                        onClick={() => setSelectedClientId(sale.client!.id)}
                        className="font-bold text-primary"
                        style={{ fontSize: '0.75rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {sale.client?.name || sale.clientSocialHandle || 'Client'}
                      </button>
                    ) : (
                      <div className="font-bold" style={{ fontSize: '0.75rem' }}>{sale.client?.name || sale.clientSocialHandle || 'Client'}</div>
                    )}
                  </td>
                  
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button 
                      onClick={() => setSelectedProduct({ name: sale.product, description: sale.productDescription })}
                      className="font-bold text-primary"
                      style={{ fontSize: '0.75rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {sale.product || '-'}
                    </button>
                  </td>

                  {isExecutionManager && (
                    <>
                      {sale.project ? (
                        <>
                          <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                            <input 
                              type="number"
                              className="input"
                              style={{ width: '70px', fontSize: '0.7rem', padding: '4px', textAlign: 'center' }}
                              defaultValue={sale.project.cost || 0}
                              onBlur={e => onProjectUpdate && onProjectUpdate(sale.project!.id, 'cost', parseFloat(e.target.value))}
                            />
                          </td>
                          <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                            <input 
                              type="text"
                              className="input"
                              style={{ width: '120px', fontSize: '0.7rem', padding: '4px', textAlign: 'center' }}
                              defaultValue={sale.project.designer || ''}
                              onBlur={e => onProjectUpdate && onProjectUpdate(sale.project!.id, 'designer', e.target.value)}
                              placeholder="Designer..."
                            />
                          </td>
                        </>
                      ) : (
                        <td colSpan={2} style={{ padding: '1rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>No project</td>
                      )}
                    </>
                  )}

                  <td style={{ padding: '0.25rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {isExecutionManager && sale.project ? (
                      <textarea
                        className="input"
                        style={{ width: '100%', fontSize: '0.7rem', padding: '6px', resize: 'vertical', minHeight: '40px', textAlign: 'center' }}
                        defaultValue={sale.project.details || sale.latestUpdate || ''}
                        onBlur={e => onProjectUpdate && onProjectUpdate(sale.project!.id, 'details', e.target.value)}
                        placeholder="Project details..."
                      />
                    ) : isLeader && onUpdateChange ? (
                      <textarea
                        className="input"
                        style={{ width: '100%', fontSize: '0.7rem', padding: '6px', resize: 'vertical', minHeight: '40px', textAlign: 'center' }}
                        defaultValue={sale.latestUpdate || ''}
                        onBlur={e => onUpdateChange(sale.id, e.target.value)}
                        placeholder="Add an update..."
                      />
                    ) : (
                      <div style={{ width: '100%', whiteSpace: 'normal', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sale.project?.details || sale.latestUpdate || '-'}
                      </div>
                    )}
                  </td>

                  {(isLeader || isExecutionManager) && (
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isExecutionManager && onAssignEM && sale.project ? (
                        <select 
                          className="input" 
                          style={{ padding: '4px', fontSize: '0.7rem', width: '100px', textAlign: 'center' }}
                          value={sale.project.assignments?.[0]?.employee?.id || ''}
                          onChange={e => onAssignEM(sale.project!.id, e.target.value)}
                        >
                          <option value="">Talha</option>
                          {aems.map(aem => (
                            <option key={aem.id} value={aem.id}>{aem.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: em === 'Talha' ? 'var(--text-secondary)' : 'inherit' }}>{em}</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
    
    <ClientModal 
      clientId={selectedClientId!} 
      isOpen={!!selectedClientId} 
      onClose={() => setSelectedClientId(null)} 
      isLeader={isLeader}
      isExecutionManager={isExecutionManager}
    />

    <ProductModal
      isOpen={!!selectedProduct}
      onClose={() => setSelectedProduct(null)}
      product={selectedProduct?.name || null}
      description={selectedProduct?.description || null}
    />
    </>
  );
}
