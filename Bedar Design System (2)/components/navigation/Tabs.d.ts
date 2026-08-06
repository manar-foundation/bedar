import * as React from 'react';
export interface TabItem{ value:string; label:React.ReactNode; }
export interface TabsProps{ tabs:TabItem[]; value:string; onChange:(v:string)=>void; }
export declare function Tabs(p:TabsProps):JSX.Element;
