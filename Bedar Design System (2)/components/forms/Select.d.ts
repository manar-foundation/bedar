import * as React from 'react';
export interface SelectOption { value: string; label: string }
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>,'children'>{
  label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode;
  options: (string | SelectOption)[]; placeholder?: string;
}
export declare function Select(p: SelectProps): JSX.Element;
