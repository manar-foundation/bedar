import React from 'react';
export function Card({ children, elevation=1, padding=24, interactive=false, as='div', style, ...rest }){
  const Comp = as;
  const [hover,setHover]=React.useState(false);
  return <Comp {...rest}
    onMouseEnter={()=>interactive && setHover(true)}
    onMouseLeave={()=>interactive && setHover(false)}
    style={{
      background:'var(--bg-surface)',
      border:'1px solid var(--border-subtle)',
      borderRadius:'var(--radius-card)',
      padding,
      boxShadow: hover ? `var(--shadow-e${Math.min(elevation+1,4)})` : `var(--shadow-e${elevation})`,
      transition:'box-shadow var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
      transform: hover ? 'translateY(-2px)' : 'none',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    }}>{children}</Comp>;
}
