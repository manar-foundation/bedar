import * as React from 'react';
/** Removable tag / filter chip. */
export interface TagProps { children: React.ReactNode; onRemove?: () => void; tone?: 'neutral'|'brand'; }
export declare function Tag(p: TagProps): JSX.Element;
