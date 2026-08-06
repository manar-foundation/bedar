import React from 'react';
export function FileUpload({ label='Upload file', hint, accept, onChange, files=[] }){
  const [drag,setDrag]=React.useState(false);
  const inputRef=React.useRef(null);
  return <div style={{display:'flex',flexDirection:'column',gap:8}}>
    <div onDragEnter={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDragOver={e=>e.preventDefault()}
      onDrop={e=>{e.preventDefault();setDrag(false);onChange && onChange(Array.from(e.dataTransfer.files))}}
      onClick={()=>inputRef.current && inputRef.current.click()}
      style={{border:'1.5px dashed '+(drag?'var(--action-primary)':'var(--field-border)'),background:drag?'var(--state-hover-tint)':'var(--field-bg)',borderRadius:'var(--radius-lg)',padding:24,textAlign:'center',cursor:'pointer',transition:'all var(--dur-fast)'}}>
      <div style={{width:40,height:40,margin:'0 auto 8px',borderRadius:'var(--radius-md)',background:'var(--brand-50)',color:'var(--brand-600)',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3v13m0-13l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      <div style={{font:'var(--type-body-sm)',fontWeight:600,color:'var(--text-primary)'}}>{label}</div>
      {hint && <div style={{font:'var(--type-caption)',color:'var(--text-muted)',marginTop:4}}>{hint}</div>}
      <input ref={inputRef} type="file" accept={accept} multiple style={{display:'none'}} onChange={e=>onChange && onChange(Array.from(e.target.files||[]))}/>
    </div>
    {files.length>0 && <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:4}}>
      {files.map((f,i)=><li key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:'var(--bg-sunken)',borderRadius:'var(--radius-sm)',fontSize:12}}><span>📎</span>{f.name}</li>)}
    </ul>}
  </div>;
}
