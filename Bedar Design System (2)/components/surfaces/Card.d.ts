import * as React from 'react';
export interface CardProps extends React.HTMLAttributes<HTMLElement>{
  children: React.ReactNode; elevation?: 1|2|3|4; padding?: number|string; interactive?: boolean; as?: any;
}
export declare function Card(p: CardProps): JSX.Element;
