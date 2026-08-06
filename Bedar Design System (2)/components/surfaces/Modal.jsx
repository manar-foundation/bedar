import React from 'react';
export function Modal({ open, onClose, title, children, footer, size='md' }){
  React.useEffect(()=>{
    if(!open) return;
    const h = e => e.key==='Escape' && onClose && onClose();
    document.addEventListener('keydown',h);
    return ()=>document.removeEventListener('keydown',h);
  },[open,onClose]);
  if(!open) return null;
  const width = size==='sm'?420 : size==='lg'?720 : 560;
  return <div role="dialog" aria-modal="true" onClick={e=>e.target===e.currentTarget && onClose && onClose()}
    style={{position:'fixed',inset:0,background:'var(--bg-overlay)',backdropFilter:'var(--blur-sm)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:1000,animation:'baydar-fade var(--dur-base) var(--ease-out)'}}>
    <div style={{width:'100%',maxWidth:width,background:'var(--bg-raised)',borderRadius:'var(--radius-modal)',boxShadow:'var(--shadow-e4)',display:'flex',flexDirection:'column',maxHeight:'90vh',overflow:'hidden'}}>
      {title && <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{font:'var(--type-h4)'}}>{title}</div>
        <button onClick={onClose} aria-label="Close" style={{background:'transparent',border:0,cursor:'pointer',color:'var(--text-secondary)',padding:6,borderRadius:6}}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
      </div>}
      <div style={{padding:'20px 24px',overflow:'auto',font:'var(--type-body-sm)',color:'var(--text-primary)'}}>{children}</div>
      {footer && <div style={{padding:'16px 24px',borderTop:'1px solid var(--border-subtle)',background:'var(--bg-sunken)',display:'flex',justifyContent:'flex-end',gap:8}}>{footer}</div>}
    </div>
  </div>;
}
if (typeof document !== 'undefined' && !document.getElementById('baydar-fade-kf')) {
  const s=document.createElement('style');s.id='baydar-fade-kf';
  s.textContent='@keyframes baydar-fade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}';
  document.head.appendChild(s);
}
