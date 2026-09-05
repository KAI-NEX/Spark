import type { Brand, LOD } from '../domain/types';
import { BASE_AVATAR, brandWearable } from '../domain/wearables';
export function WearableCharacter({brand,lod='full',labelled=false}:{brand:Brand;lod?:LOD;labelled?:boolean}) {
  const look = brandWearable(brand);
  return <svg className={`character brand-character wearable-character ${lod === 'simple' ? 'character-mid' : 'character-near'}`} viewBox="0 0 256 320" role={labelled?'img':undefined} aria-label={labelled?`${brand.name} · ${look.label}`:undefined} aria-hidden={labelled?undefined:true} data-wearable-source={look.source}>
    <image href={look.url} x="25" y="0" width="205" height="315" preserveAspectRatio="xMidYMid meet" onError={event=>{event.currentTarget.setAttribute('href',BASE_AVATAR);}} />
  </svg>;
}
