import * as React from 'react';
/** Blog / program card. CMS-driven. */
export interface ContentCardProps{ image?:React.ReactNode; category?:React.ReactNode; title:React.ReactNode; excerpt?:React.ReactNode; meta?:React.ReactNode; href?:string; }
export declare function ContentCard(p:ContentCardProps):JSX.Element;
