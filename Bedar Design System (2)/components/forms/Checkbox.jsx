import React from 'react';
export function Checkbox({ checked, onChange, label, description, disabled, id, ...rest }){
  const uid = id || React.useId();
  return <label htmlFor={uid} style={{display:'flex',gap:10,alignItems:'flex-start',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1}}>
    <span style={{position:'relative',display:'inline-flex',width:18,height:18,marginTop:2,borderRadius:4,border:'1.5px solid '+(checked?'var(--action-primary)':'var(--field-border)'),background:checked?'var(--action-primary)':'var(--field-bg)',transition:'all var(--dur-fast)'}}>
      <input id={uid} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} {...rest} style={{opacity:0,position:'absolute',inset:0,margin:0,cursor:'inherit'}}/>
      {checked && <svg width="12" height="12" viewBox="0 0 12 12" style={{margin:'auto',color:'#fff'}}><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </span>
    <span style={{display:'flex',flexDirection:'column',gap:2}}>
      {label && <span style={{font:'var(--type-body-sm)',color:'var(--text-primary)'}}>{label}</span>}
      {description && <span style={{font:'var(--type-caption)',color:'var(--text-muted)'}}>{description}</span>}
    </span>
  </label>;
}
