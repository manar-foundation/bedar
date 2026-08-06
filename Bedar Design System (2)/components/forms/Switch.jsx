import React from 'react';
export function Switch({ checked, onChange, label, disabled, id }){
  const uid = id || React.useId();
  return <label htmlFor={uid} style={{display:'inline-flex',alignItems:'center',gap:10,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1}}>
    <span style={{position:'relative',width:36,height:20,background:checked?'var(--action-primary)':'var(--neutral-300)',borderRadius:999,transition:'background var(--dur-fast)'}}>
      <input id={uid} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{opacity:0,position:'absolute',inset:0,margin:0}}/>
      <span style={{position:'absolute',top:2,left:checked?18:2,width:16,height:16,background:'#fff',borderRadius:'50%',boxShadow:'var(--shadow-e1)',transition:'left var(--dur-fast) var(--ease-standard)'}}/>
    </span>
    {label && <span style={{font:'var(--type-body-sm)'}}>{label}</span>}
  </label>;
}
