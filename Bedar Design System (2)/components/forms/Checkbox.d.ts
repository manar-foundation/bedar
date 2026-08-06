import * as React from 'react';
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>,'onChange'|'type'>{
  checked?: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode; description?: React.ReactNode;
}
export declare function Checkbox(p: CheckboxProps): JSX.Element;
