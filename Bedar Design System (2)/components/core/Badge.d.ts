import * as React from 'react';
/** Small status/label pill. Use `dot` for live/status indicators. */
export interface BadgeProps { children: React.ReactNode; tone?:'neutral'|'brand'|'accent'|'success'|'warning'|'error'|'info'; dot?: boolean; size?:'sm'|'md'; }
export declare function Badge(p: BadgeProps): JSX.Element;
