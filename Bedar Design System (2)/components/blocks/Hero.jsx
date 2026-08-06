import React from 'react';
/** Baydar dynamic Hero block — every value is CMS-mappable (see JSON schema in prompt). */
export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta, image, align='start', accentColor }){
  return <section style={{padding:'80px 32px',background:'linear-gradient(180deg, var(--brand-50) 0%, var(--bg-app) 100%)'}}>
    <div style={{maxWidth:'var(--container-2xl)',margin:'0 auto',display:'grid',gridTemplateColumns:image?'1.1fr 1fr':'1fr',gap:48,alignItems:'center'}}>
      <div style={{textAlign:align}}>
        {eyebrow && <div style={{font:'var(--type-overline)',color:accentColor||'var(--brand-600)',textTransform:'uppercase',marginBottom:12}}>{eyebrow}</div>}
        <h1 style={{font:'var(--type-h1)',color:'var(--text-primary)',margin:'0 0 16px',letterSpacing:'-0.02em'}}>{title}</h1>
        {subtitle && <p style={{font:'var(--type-body-lg)',color:'var(--text-secondary)',margin:'0 0 32px',maxWidth:640}}>{subtitle}</p>}
        <div style={{display:'inline-flex',gap:12,flexWrap:'wrap'}}>{primaryCta}{secondaryCta}</div>
      </div>
      {image && <div style={{borderRadius:'var(--radius-2xl)',overflow:'hidden',boxShadow:'var(--shadow-e3)',aspectRatio:'4/3',background:'var(--bg-sunken)'}}>{image}</div>}
    </div>
  </section>;
}
