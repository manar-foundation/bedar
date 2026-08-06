import React from 'react';
const tones = {
  neutral:{bg:'var(--neutral-100)',fg:'var(--neutral-700)'},
  brand:{bg:'var(--brand-100)',fg:'var(--brand-700)'},
  accent:{bg:'var(--accent-100)',fg:'var(--accent-700)'},
  success:{bg:'var(--success-100)',fg:'var(--success-700)'},
  warning:{bg:'var(--warning-100)',fg:'var(--warning-700)'},
  error:{bg:'var(--error-100)',fg:'var(--error-700)'},
  info:{bg:'var(--info-100)',fg:'var(--info-700)'},
};
export function Badge({ children, tone='neutral', dot=false, size='md' }) {
  const t = tones[tone]||tones.neutral;
  const pad = size==='sm' ? '2px 8px' : '4px 10px';
  const fs = size==='sm' ? 11 : 12;
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,background:t.bg,color:t.fg,padding:pad,borderRadius:'var(--radius-full)',fontSize:fs,fontWeight:600,fontFamily:'var(--font-display)',lineHeight:1}}>
    {dot && <span style={{width:6,height:6,borderRadius:'50%',background:t.fg}}/>}
    {children}
  </span>;
}
