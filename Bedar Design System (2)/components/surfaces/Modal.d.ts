import * as React from 'react';
export interface ModalProps{ open:boolean; onClose:()=>void; title?:React.ReactNode; children:React.ReactNode; footer?:React.ReactNode; size?:'sm'|'md'|'lg'; }
export declare function Modal(p:ModalProps):JSX.Element|null;
