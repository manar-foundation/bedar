import React from 'react';
export function Tabs({ tabs=[], value, onChange }){
  return <div style={{display:'flex',gap:4,borderBottom:'1px solid var(--border-default)'}}>
    {tabs.map(t=>{
      const active = t.value===value;
      return <button key={t.value} onClick={()=>onChange && onChange(t.value)}
        style={{background:'transparent',border:0,padding:'10px 14px',borderBottom:'2px solid '+(active?'var(--action-primary)':'transparent'),color:active?'var(--text-primary)':'var(--text-secondary)',font:'var(--type-button)',fontWeight:active?600:500,cursor:'pointer',marginBottom:-1,transition:'color var(--dur-fast),border-color var(--dur-fast)'}}>
        {t.label}
      </button>;
    })}
  </div>;
}
