import React from 'react';
export function ContentCard({ image, category, title, excerpt, meta, href='#' }){
  return <a href={href} style={{display:'flex',flexDirection:'column',background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-card)',overflow:'hidden',color:'inherit',textDecoration:'none',transition:'transform var(--dur-fast),box-shadow var(--dur-fast)'}}
    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='var(--shadow-e2)'}}
    onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
    <div style={{aspectRatio:'16/10',background:'var(--bg-sunken)'}}>{image}</div>
    <div style={{padding:20,display:'flex',flexDirection:'column',gap:8}}>
      {category && <span style={{font:'var(--type-overline)',color:'var(--brand-600)',textTransform:'uppercase'}}>{category}</span>}
      <h3 style={{font:'var(--type-h5)',margin:0}}>{title}</h3>
      {excerpt && <p style={{font:'var(--type-body-sm)',color:'var(--text-secondary)',margin:0}}>{excerpt}</p>}
      {meta && <div style={{font:'var(--type-caption)',color:'var(--text-muted)',marginTop:4}}>{meta}</div>}
    </div>
  </a>;
}
