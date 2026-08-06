import * as React from 'react';
/**
 * Hero block — the entry impression. Fully CMS-driven via the JSON schema below.
 * @startingPoint section="Blocks" subtitle="Hero section (CMS-driven)" viewport="1280x640"
 */
export interface HeroProps{
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryCta?: React.ReactNode;
  secondaryCta?: React.ReactNode;
  image?: React.ReactNode;
  align?: 'start'|'center';
  accentColor?: string;
}
export declare function Hero(p:HeroProps):JSX.Element;
