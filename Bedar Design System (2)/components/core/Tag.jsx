import React from 'react';
export function Tag({ children, onRemove, tone='neutral' }){
  const bg = tone==='brand' ? 'var(--brand-50)' : 'var(--neutral-50)';
  const fg = tone==='brand' ? 'var(--brand-700)' : 'var(--text-primary)';
  const bd = tone==='brand' ? 'var(--brand-200)' : 'var(--border-default)';
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px 4px 12px',background:bg,color:fg,border:'1px solid '+bd,borderRadius:'var(--radius-full)',fontSize:12,fontWeight:500}}>
    {children}
    {onRemove && <button onClick={onRemove} aria-label="Remove" style={{border:0,background:'transparent',cursor:'pointer',color:'inherit',padding:0,display:'inline-flex',alignItems:'center'}}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    </button>}
  </span>;
}
