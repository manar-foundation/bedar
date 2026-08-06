import * as React from 'react';
export interface BreadcrumbItem{ label:React.ReactNode; href?:string; }
export interface BreadcrumbsProps{ items:BreadcrumbItem[]; }
export declare function Breadcrumbs(p:BreadcrumbsProps):JSX.Element;
