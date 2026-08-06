import React from 'react';
export function Select({ label, hint, error, options=[], id, value, onChange, placeholder, ...rest }){
  const uid = id || React.useId();
  const [focus,setFocus]=React.useState(false);
  const borderColor = error?'var(--error-500)':'var(--field-border)';
  return <div style={{display:'flex',flexDirection:'column',gap:6}}>
    {label && <label htmlFor={uid} style={{font:'var(--type-label)'}}>{label}</label>}
    <div style={{position:'relative'}}>
      <select id={uid} value={value} onChange={onChange} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{appearance:'none',width:'100%',height:40,padding:'0 40px 0 14px',background:'var(--field-bg)',border:'1px solid '+borderColor,borderRadius:'var(--radius-input)',font:'var(--type-body-sm)',color:'var(--text-primary)',outline:'none',cursor:'pointer',
          boxShadow:focus?'var(--shadow-focus)':'none',borderColor:focus?'var(--border-focus)':borderColor}} {...rest}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => typeof o==='string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{position:'absolute',insetInlineEnd:14,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text-muted)'}}>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
      </span>
    </div>
    {(hint||error) && <div style={{font:'var(--type-caption)',color:error?'var(--error-500)':'var(--text-muted)'}}>{error||hint}</div>}
  </div>;
}
