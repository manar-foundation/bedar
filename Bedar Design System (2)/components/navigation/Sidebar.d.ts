import * as React from 'react';
export interface SidebarItem{ id?:string; label?:React.ReactNode; icon?:React.ReactNode; badge?:React.ReactNode; section?:string; }
export interface SidebarProps{ logo?:React.ReactNode; items:SidebarItem[]; activeId?:string; onSelect?:(id:string)=>void; footer?:React.ReactNode; }
export declare function Sidebar(p:SidebarProps):JSX.Element;
