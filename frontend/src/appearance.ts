import {writable} from 'svelte/store';
export type CoverMode='hidden'|'portrait'|'background';
function stored<T>(key:string,initial:T,valid:(v:unknown)=>v is T){let value=initial;try{const v=JSON.parse(localStorage.getItem(key)||'null');if(valid(v))value=v;}catch{}const s=writable(value);s.subscribe(v=>{try{localStorage.setItem(key,JSON.stringify(v));}catch{}});return s;}
export const coverMode=stored<CoverMode>('sailune.coverMode','hidden',(v):v is CoverMode=>v==='hidden'||v==='portrait'||v==='background');
export const detailArt=stored<boolean>('sailune.detailArt',true,(v):v is boolean=>typeof v==='boolean');
