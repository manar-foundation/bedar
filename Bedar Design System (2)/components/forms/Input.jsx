import React from 'react';
export function Input({ label, hint, error, icon, id, dir, ...rest }){
  const uid = id || React.useId();
  const state = error ? 'error' : 'default';
  const borderColor = state==='error' ? 'var(--error-500)' : 'var(--field-border)';
  const [focus,setFocus]=React.useState(false);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}} dir={dir}>
      {label && <label htmlFor={uid} style={{font:'var(--type-label)',color:'var(--text-primary)'}}>{label}</label>}
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        {icon && <span style={{position:'absolute',insetInlineStart:12,color:'var(--text-muted)',display:'inline-flex',pointerEvents:'none'}}>{icon}</span>}
        <input id={uid} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
          style={{
            width:'100%',height:40,padding:icon?'0 14px 0 40px':'0 14px',
            background:'var(--field-bg)',border:'1px solid '+borderColor,
            borderRadius:'var(--radius-input)',
            font:'var(--type-body-sm)',color:'var(--text-primary)',
            outline:'none',
            transition:'border-color var(--dur-fast), box-shadow var(--dur-fast)',
            boxShadow: focus ? (state==='error'?'var(--shadow-focus-danger)':'var(--shadow-focus)') : 'none',
            borderColor: focus ? (state==='error'?'var(--error-500)':'var(--border-focus)') : borderColor,
          }} {...rest}/>
      </div>
      {(hint || error) && <div style={{font:'var(--type-caption)',color:error?'var(--error-500)':'var(--text-muted)'}}>{error||hint}</div>}
    </div>
  );
}
