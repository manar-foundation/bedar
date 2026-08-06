import * as React from 'react';
/** Single-line text field with label, hint, and error slot. Supports RTL via `dir`. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>,'size'>{
  label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; icon?: React.ReactNode;
}
export declare function Input(p: InputProps): JSX.Element;
