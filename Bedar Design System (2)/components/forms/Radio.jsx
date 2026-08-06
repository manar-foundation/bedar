import React from 'react';
export function Radio({ checked, onChange, label, description, name, value, disabled, id }){
  const uid = id || React.useId();
  return <label htmlFor={uid} style={{display:'flex',gap:10,alignItems:'flex-start',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1}}>
    <span style={{position:'relative',display:'inline-flex',width:18,height:18,marginTop:2,borderRadius:'50%',border:'1.5px solid '+(checked?'var(--action-primary)':'var(--field-border)'),background:'var(--field-bg)',alignItems:'center',justifyContent:'center'}}>
      <input id={uid} type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} style={{opacity:0,position:'absolute',inset:0,margin:0}}/>
      {checked && <span style={{width:8,height:8,borderRadius:'50%',background:'var(--action-primary)'}}/>}
    </span>
    <span style={{display:'flex',flexDirection:'column',gap:2}}>
      {label && <span style={{font:'var(--type-body-sm)'}}>{label}</span>}
      {description && <span style={{font:'var(--type-caption)',color:'var(--text-muted)'}}>{description}</span>}
    </span>
  </label>;
}
