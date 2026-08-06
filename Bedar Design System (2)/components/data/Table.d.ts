import * as React from 'react';
export interface TableColumn{ key:string; header:React.ReactNode; render?:(row:any)=>React.ReactNode; }
export interface TableProps{ columns:TableColumn[]; rows:any[]; striped?:boolean; dense?:boolean; }
export declare function Table(p:TableProps):JSX.Element;
