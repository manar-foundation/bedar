import React from 'react';
export function Breadcrumbs({ items=[] }){
  return <nav aria-label="Breadcrumb"><ol style={{listStyle:'none',padding:0,margin:0,display:'flex',alignItems:'center',gap:6,font:'var(--type-body-sm)'}}>
    {items.map((it,i)=>{
      const last = i===items.length-1;
      return <li key={i} style={{display:'inline-flex',alignItems:'center',gap:6}}>
        {last ? <span style={{color:'var(--text-primary)',fontWeight:600}}>{it.label}</span>
              : <a href={it.href||'#'} style={{color:'var(--text-secondary)'}}>{it.label}</a>}
        {!last && <span style={{color:'var(--text-muted)'}}>/</span>}
      </li>;
    })}
  </ol></nav>;
}
