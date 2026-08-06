import React from 'react';
export function Navbar({ logo, links=[], actions, transparent=false }){
  return <header style={{position:'sticky',top:0,zIndex:50,background:transparent?'var(--glass-bg)':'var(--bg-surface)',backdropFilter:transparent?'var(--blur-md)':'none',borderBottom:'1px solid '+(transparent?'var(--glass-border)':'var(--border-subtle)')}}>
    <div style={{maxWidth:'var(--container-2xl)',margin:'0 auto',padding:'14px 32px',display:'flex',alignItems:'center',gap:32}}>
      <div style={{color:'var(--text-primary)',display:'inline-flex',alignItems:'center'}}>{logo}</div>
      <nav style={{display:'flex',gap:4,marginInlineStart:'auto'}}>
        {links.map(l=><a key={l.href} href={l.href} style={{padding:'8px 12px',color:l.active?'var(--brand-700)':'var(--text-secondary)',font:'var(--type-body-sm)',fontWeight:l.active?600:500,borderRadius:'var(--radius-sm)'}}>{l.label}</a>)}
      </nav>
      <div style={{display:'flex',gap:8}}>{actions}</div>
    </div>
  </header>;
}
