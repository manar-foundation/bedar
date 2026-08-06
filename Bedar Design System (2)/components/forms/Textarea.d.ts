import * as React from 'react';
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>{
  label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode;
}
export declare function Textarea(p: TextareaProps): JSX.Element;
