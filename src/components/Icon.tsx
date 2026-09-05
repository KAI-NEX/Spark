export function Icon({ name }: { name: 'plus' | 'minus' | 'reset' | 'regenerate' | 'arrow' | 'orbit' | 'home' }) {
  return <svg width={name === 'orbit' ? 44 : 18} height={name === 'orbit' ? 44 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === 'orbit' ? 0.65 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'plus' ? <path d="M5 12h14M12 5v14" /> : null}
    {name === 'minus' ? <path d="M5 12h14" /> : null}
    {name === 'reset' ? <><circle cx="12" cy="12" r="6" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></> : null}
    {name === 'home' ? <path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10" /> : null}
    {name === 'regenerate' ? <><path d="M20 10a8 8 0 0 0-14-4L3 9m0-6v6h6M4 14a8 8 0 0 0 14 4l3-3m0 6v-6h-6" /></> : null}
    {name === 'arrow' ? <path d="M4 12h16m-6-6 6 6-6 6" /> : null}
    {name === 'orbit' ? <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="12" ry="4" transform="rotate(-35 12 12)" /><circle cx="12" cy="12" r="3.3" fill="currentColor" stroke="none" /><circle cx="21" cy="6" r="1.4" fill="currentColor" stroke="none" /></> : null}
  </svg>;
}
