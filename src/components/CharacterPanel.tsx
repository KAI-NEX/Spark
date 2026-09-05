import { useEffect, useRef } from 'react';
import type { Brand } from '../domain/types';
import { describeBrandCharacter } from '../engines/character';
import type { CharacterStyle } from '../engines/character';
import { BrandCharacter } from './BrandCharacter';
import { CapabilityIcon } from './CapabilityIcon';

export function CharacterStylePicker({ value, onChange }: { value: CharacterStyle; onChange: (style: CharacterStyle) => void }) {
  return <div className="character-style-picker" role="group" aria-label="Character art style">
    <button aria-pressed={value === 'facet'} onClick={() => onChange('facet')}>Low poly</button>
    <button aria-pressed={value === 'halftone'} onClick={() => onChange('halftone')}>Halftone</button>
  </div>;
}

export function CharacterPanel({ brand, style, onStyleChange, count, onShowAtlas }: {
  brand: Brand; style: CharacterStyle; onStyleChange: (style: CharacterStyle) => void; count: number; onShowAtlas: () => void;
}) {
  const { capabilities, primary, needs } = describeBrandCharacter(brand);
  return <section className="character-panel" aria-label={`${brand.name} capabilities`}>
    <div className="character-panel-heading"><span className="mono">BRAND CHARACTER</span>{brand.character ? <span>{brand.character.source === 'ai' ? 'AI 生成' : '本地规则预览'}</span> : <CharacterStylePicker value={style} onChange={onStyleChange} />}</div>
    <div className="character-profile">
      <div className="character-portrait"><BrandCharacter brand={brand} labelled /></div>
      <div className="character-profile-copy">
        <p className="character-caption">What they bring</p>
        <strong className="character-primary"><CapabilityIcon id={primary?.id ?? 'unknown'} />{primary?.label ?? 'Not specified'}</strong>
        <div className="character-capabilities">{capabilities.slice(1).map(capability => <span key={capability.id} title={`Brand brief: ${capability.evidence}`}><CapabilityIcon id={capability.id} />{capability.label}</span>)}</div>
      </div>
    </div>
    <details className="capability-evidence"><summary>Read the capability brief</summary><p>{brand.offers || 'No capabilities provided yet.'}</p></details>
    <p className="character-seeking"><span>Looking for</span>{needs.length ? needs.map(capability => capability.label).join(' · ') : brand.needs || 'Not specified'}</p>
    <button className="character-atlas-link" onClick={onShowAtlas}>Explore all {count} characters <span aria-hidden="true">↗</span></button>
  </section>;
}

export function CharacterAtlas({ brands, style, onStyleChange, onClose, onInspect }: {
  brands: readonly Brand[]; style: CharacterStyle; onStyleChange: (style: CharacterStyle) => void;
  onClose: () => void; onInspect: (id: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <dialog className="character-atlas" ref={dialogRef} aria-labelledby="character-atlas-title"
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="character-atlas-body">
      <header className="character-atlas-header"><div><p className="mono">THE PEOPLE OF POSSIBILITY</p><h1 id="character-atlas-title">Different tools. Shared possibilities.</h1><p>Each tool represents an ability in the brand brief. Select a character to explore.</p></div><button className="atlas-close" aria-label="Close character gallery" onClick={onClose}>×</button></header>
      <div className="character-atlas-toolbar"><span>{brands.length} brand characters</span><CharacterStylePicker value={style} onChange={onStyleChange} /></div>
      <div className="character-atlas-grid">{brands.map(brand => {
        const { primary, capabilities } = describeBrandCharacter(brand);
        return <button className="atlas-card" key={brand.id} onClick={() => onInspect(brand.id)} aria-label={`Inspect ${brand.name}: ${primary?.label ?? 'capability not specified'}`}>
          <span className="atlas-portrait"><BrandCharacter brand={brand} /></span><strong>{brand.name}</strong>
          <span className="atlas-primary"><CapabilityIcon id={primary?.id ?? 'unknown'} />{primary?.label ?? 'Not specified'}</span>
          <span className="atlas-secondary">{capabilities.slice(1, 3).map(capability => capability.label).join(' · ') || 'Read the brand brief'}{capabilities.length > 3 ? ` +${capabilities.length - 3}` : ''}</span>
        </button>;
      })}</div>
    </div>
  </dialog>;
}
