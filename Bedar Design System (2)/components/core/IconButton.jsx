import React from 'react';
const sizes = { sm: 32, md: 40, lg: 48 };

export function IconButton({ children, variant='ghost', size='md', 'aria-label':aria, onClick, disabled, ...rest }) {
  const [hover,setHover]=React.useState(false);
  const dim = sizes[size] || 40;
  const bg = variant==='primary' ? 'var(--action-primary)' :
             variant==='outline' ? 'transparent' :
             variant==='solid'   ? 'var(--bg-sunken)' : 'transparent';
  const color = variant==='primary' ? 'var(--action-primary-on)' : 'var(--text-primary)';
  const border = variant==='outline' ? '1px solid var(--border-default)' : '1px solid transparent';
  const hoverBg = variant==='primary' ? 'var(--action-primary-hover)' : 'var(--state-hover-tint)';
  return (
    <button aria-label={aria} onClick={disabled?undefined:onClick} disabled={disabled}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        width:dim,height:dim,display:'inline-flex',alignItems:'center',justifyContent:'center',
        borderRadius:'var(--radius-md)', background: hover && !disabled ? hoverBg : bg,
        color, border, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1,
        transition:'background var(--dur-fast) var(--ease-standard)'
      }} {...rest}>{children}</button>
  );
}
