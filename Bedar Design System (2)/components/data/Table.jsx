import React from 'react';
export function Table({ columns=[], rows=[], striped=false, dense=false }){
  const cellPad = dense ? '8px 12px' : '12px 16px';
  return <div style={{width:'100%',overflow:'auto',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-card)',background:'var(--bg-surface)'}}>
    <table style={{width:'100%',borderCollapse:'collapse',font:'var(--type-body-sm)'}}>
      <thead style={{background:'var(--bg-sunken)'}}>
        <tr>{columns.map(c=><th key={c.key} style={{textAlign:'start',padding:cellPad,font:'var(--type-label)',color:'var(--text-secondary)',borderBottom:'1px solid var(--border-default)',whiteSpace:'nowrap'}}>{c.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r,i)=><tr key={i} style={{background:striped && i%2 ? 'var(--bg-sunken)' : 'transparent',borderBottom:'1px solid var(--border-subtle)'}}>
          {columns.map(c=><td key={c.key} style={{padding:cellPad,color:'var(--text-primary)'}}>{c.render? c.render(r) : r[c.key]}</td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
