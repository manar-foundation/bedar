import * as React from 'react';
export interface Feature{ icon?:React.ReactNode; title:React.ReactNode; description:React.ReactNode; }
export interface FeatureGridProps{ eyebrow?:React.ReactNode; title?:React.ReactNode; features:Feature[]; columns?:2|3|4; }
export declare function FeatureGrid(p:FeatureGridProps):JSX.Element;
