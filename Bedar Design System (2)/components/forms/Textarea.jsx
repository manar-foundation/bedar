import React from 'react';
export function Textarea({ label, hint, error, id, rows=4, ...rest }){
  const uid = id || React.useId();
  const [focus,setFocus]=React.useState(false);
  const borderColor = error ? 'var(--error-500)' : 'var(--field-border)';
  return <div style={{display:'flex',flexDirection:'column',gap:6}}>
    {label && <label htmlFor={uid} style={{font:'var(--type-label)'}}>{label}</label>}
    <textarea id={uid} rows={rows} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
      style={{width:'100%',padding:'10px 14px',background:'var(--field-bg)',border:'1px solid '+borderColor,borderRadius:'var(--radius-input)',font:'var(--type-body-sm)',color:'var(--text-primary)',outline:'none',resize:'vertical',
        boxShadow:focus?(error?'var(--shadow-focus-danger)':'var(--shadow-focus)'):'none',
        borderColor:focus?(error?'var(--error-500)':'var(--border-focus)'):borderColor}} {...rest}/>
    {(hint||error) && <div style={{font:'var(--type-caption)',color:error?'var(--error-500)':'var(--text-muted)'}}>{error||hint}</div>}
  </div>;
}
