import * as React from 'react';
export interface RadioProps{ checked?:boolean; onChange?:(e:React.ChangeEvent<HTMLInputElement>)=>void; name?:string; value?:string; label?:React.ReactNode; description?:React.ReactNode; disabled?:boolean; id?:string; }
export declare function Radio(p: RadioProps): JSX.Element;
