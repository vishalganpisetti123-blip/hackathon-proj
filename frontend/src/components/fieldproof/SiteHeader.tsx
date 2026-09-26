'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, List, X } from '@phosphor-icons/react';
import { AppHeader } from '@/components/layout/AppHeader';
import s from './site.module.css';

export function SiteHeader() {
  const path = usePathname(); const [open, setOpen] = useState(false);
  if (path.replace(/\/$/, '') === '/transcribe') return null;
  if (path !== '/') return <AppHeader />;
  return <header className={s.nav}>
    <Link href="/" className={s.logo} aria-label="FieldProof home"><span className={s.logoMark} aria-hidden="true"><i /><i /><i /></span>fieldproof<span className={s.logoDot}>.</span></Link>
    <nav className={s.desktopNav} aria-label="Main navigation"><Link href="/#why">Why FieldProof</Link><Link href="/#how">How it works</Link><Link href="/analyze">Language lab <ArrowUpRight size={14} /></Link></nav>
    <Link href="/transcribe" className={s.navCta}>Open transcriber <ArrowUpRight size={16} /></Link>
    <button className={s.menuToggle} onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X size={24} /> : <List size={24} />}</button>
    {open && <nav id="mobile-navigation" className={s.mobileNav} aria-label="Mobile navigation"><Link onClick={() => setOpen(false)} href="/#why">Why FieldProof</Link><Link onClick={() => setOpen(false)} href="/#how">How it works</Link><Link onClick={() => setOpen(false)} href="/analyze">Language lab</Link><Link onClick={() => setOpen(false)} href="/transcribe">Open transcriber</Link></nav>}
  </header>;
}
