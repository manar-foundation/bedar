import React from 'react';
export function Sidebar({ logo, items=[], footer, activeId, onSelect }){
  return <aside style={{width:260,height:'100%',background:'var(--bg-surface)',borderInlineEnd:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',padding:'20px 12px',gap:4}}>
    {logo && <div style={{padding:'8px 12px 16px'}}>{logo}</div>}
    <nav style={{display:'flex',flexDirection:'column',gap:2,flex:1}}>
      {items.map(it => it.section ? (
        <div key={'s-'+it.section} style={{font:'var(--type-overline)',color:'var(--text-muted)',padding:'12px 12px 4px'}}>{it.section}</div>
      ) : (
        <button key={it.id} onClick={()=>onSelect && onSelect(it.id)}
          style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:'var(--radius-md)',border:0,background:activeId===it.id?'var(--state-selected-tint)':'transparent',color:activeId===it.id?'var(--brand-700)':'var(--text-secondary)',font:'var(--type-body-sm)',fontWeight:activeId===it.id?600:500,cursor:'pointer',textAlign:'start',width:'100%'}}>
          {it.icon}<span style={{flex:1}}>{it.label}</span>{it.badge}
        </button>
      ))}
    </nav>
    {footer && <div style={{borderTop:'1px solid var(--border-subtle)',paddingTop:12}}>{footer}</div>}
  </aside>;
}
