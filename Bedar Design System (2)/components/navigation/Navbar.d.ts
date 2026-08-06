import * as React from 'react';
export interface NavbarLink{ label:React.ReactNode; href:string; active?:boolean; }
export interface NavbarProps{ logo:React.ReactNode; links:NavbarLink[]; actions?:React.ReactNode; transparent?:boolean; }
export declare function Navbar(p:NavbarProps):JSX.Element;
