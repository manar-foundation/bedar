import React from 'react';
export function Testimonial({ quote, author, role, avatar, accent=false }){
  return <figure style={{margin:0,background:accent?'var(--brand-700)':'var(--bg-surface)',color:accent?'#fff':'var(--text-primary)',padding:28,borderRadius:'var(--radius-card)',border:accent?0:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',gap:20,height:'100%'}}>
    <svg width="28" height="20" viewBox="0 0 28 20" style={{color:accent?'var(--brand-200)':'var(--brand-400)'}}><path d="M0 20V10c0-5.5 4-9 9-10l1 3c-3 1-5 3-5 6h4v11H0zm14 0V10c0-5.5 4-9 9-10l1 3c-3 1-5 3-5 6h4v11H14z" fill="currentColor"/></svg>
    <blockquote style={{margin:0,font:'var(--type-body-lg)',lineHeight:1.6}}>{quote}</blockquote>
    <figcaption style={{display:'flex',gap:12,alignItems:'center',marginTop:'auto'}}>
      {avatar && <div style={{width:44,height:44,borderRadius:'50%',overflow:'hidden',background:'var(--neutral-200)'}}>{avatar}</div>}
      <div>
        <div style={{fontWeight:600}}>{author}</div>
        <div style={{font:'var(--type-caption)',opacity:0.8}}>{role}</div>
      </div>
    </figcaption>
  </figure>;
}
