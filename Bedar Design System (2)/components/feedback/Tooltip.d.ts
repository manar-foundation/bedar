import * as React from 'react';
export interface TooltipProps{ children:React.ReactNode; content:React.ReactNode; placement?:'top'|'bottom'|'left'|'right'; }
export declare function Tooltip(p:TooltipProps):JSX.Element;
