import * as React from 'react';
export interface SwitchProps{ checked?:boolean; onChange?:(e:React.ChangeEvent<HTMLInputElement>)=>void; label?:React.ReactNode; disabled?:boolean; id?:string; }
export declare function Switch(p: SwitchProps): JSX.Element;
