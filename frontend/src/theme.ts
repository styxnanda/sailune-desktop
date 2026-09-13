import {writable} from 'svelte/store';
export type Theme='light'|'dark';
let initial:Theme='light';
try {const saved=localStorage.getItem('sailune-theme');initial=saved==='dark'||(!saved&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}catch{}
export const theme=writable<Theme>(initial);
theme.subscribe(value=>{
 document.documentElement.dataset.theme=value;
 try{localStorage.setItem('sailune-theme',value);}catch{}
});
