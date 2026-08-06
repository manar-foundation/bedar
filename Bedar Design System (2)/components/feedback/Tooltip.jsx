import React from 'react';
export function Tooltip({ children, content, placement='top' }){
  const [show,setShow]=React.useState(false);
  const pos = { top:{bottom:'100%',left:'50%',transform:'translate(-50%,-8px)'},
                bottom:{top:'100%',left:'50%',transform:'translate(-50%,8px)'},
                left:{right:'100%',top:'50%',transform:'translate(-8px,-50%)'},
                right:{left:'100%',top:'50%',transform:'translate(8px,-50%)'} }[placement];
  return <span style={{position:'relative',display:'inline-flex'}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)} onFocus={()=>setShow(true)} onBlur={()=>setShow(false)}>
    {children}
    {show && <span role="tooltip" style={{position:'absolute',...pos,background:'var(--neutral-900)',color:'#fff',padding:'6px 10px',borderRadius:'var(--radius-sm)',fontSize:12,whiteSpace:'nowrap',pointerEvents:'none',boxShadow:'var(--shadow-e2)',zIndex:100}}>{content}</span>}
  </span>;
}
