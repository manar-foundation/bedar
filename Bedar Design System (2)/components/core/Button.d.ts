import * as React from 'react';

/**
 * The primary call-to-action across Baydar. Use `primary` for the single most
 * important action on a view; `secondary`/`ghost` for adjacent actions;
 * `danger` for destructive intents.
 *
 * @startingPoint section="Actions" subtitle="Button variants and states" viewport="700x180"
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export declare function Button(props: ButtonProps): JSX.Element;
