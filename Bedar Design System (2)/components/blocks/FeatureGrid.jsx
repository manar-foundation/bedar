import React from 'react';
export function FeatureGrid({ eyebrow, title, features=[], columns=3 }){
  return <section style={{padding:'80px 32px'}}>
    <div style={{maxWidth:'var(--container-2xl)',margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:48,maxWidth:720,marginInline:'auto'}}>
        {eyebrow && <div style={{font:'var(--type-overline)',color:'var(--brand-600)',textTransform:'uppercase',marginBottom:8}}>{eyebrow}</div>}
        {title && <h2 style={{font:'var(--type-h2)',margin:0}}>{title}</h2>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat('+columns+',1fr)',gap:24}}>
        {features.map((f,i)=><div key={i} style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-card)',padding:28,display:'flex',flexDirection:'column',gap:12}}>
          {f.icon && <div style={{width:48,height:48,borderRadius:'var(--radius-md)',background:'var(--brand-50)',color:'var(--brand-600)',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>{f.icon}</div>}
          <h3 style={{font:'var(--type-h4)',margin:0}}>{f.title}</h3>
          <p style={{font:'var(--type-body-sm)',color:'var(--text-secondary)',margin:0}}>{f.description}</p>
        </div>)}
      </div>
    </div>
  </section>;
}
