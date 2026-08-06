import * as React from 'react';
export interface FileUploadProps{ label?:React.ReactNode; hint?:React.ReactNode; accept?:string; files?:File[]; onChange?:(files:File[])=>void; }
export declare function FileUpload(p: FileUploadProps): JSX.Element;
