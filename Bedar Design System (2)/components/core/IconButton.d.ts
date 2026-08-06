import * as React from 'react';
/** Icon-only button. Requires `aria-label` for accessibility. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'ghost' | 'solid' | 'outline' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}
export declare function IconButton(p: IconButtonProps): JSX.Element;
