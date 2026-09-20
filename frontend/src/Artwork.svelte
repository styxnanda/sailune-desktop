<script lang="ts">
 import {artworkInfo,artworkURL,type Config,type Art} from './api';
 export let config:Config;export let id:number;export let site:string;export let role:'cover'|'background'='cover';export let small=true;export let revision=0;
 let src='',art:Art|undefined,failed=false;let generation=0;
 async function load(){const g=++generation;src='';failed=false;try{const arts=await artworkInfo(config,id);const a=arts.find(v=>v.role===role);if(g!==generation)return;art=a;if(a){const url=await artworkURL(config,a.asset_id,small);if(g===generation)src=url;}}catch{if(g===generation)failed=true;}}
 $: {config.Data;id;role;revision;void load();}
</script>
<div class:portrait-art={role==='cover'} class:landscape-art={role==='background'} class="artwork" style:--art-x={`${(art?.x??.5)*100}%`} style:--art-y={`${(art?.y??.5)*100}%`}>
 {#if src}<img {src} alt={role==='cover'?'Story cover':'Story background'} loading="lazy" decoding="async"/>{:else}<span class="art-placeholder" class:ao3={site==='ao3'} class:ffn={site==='ffn'} aria-label={failed?'Artwork unavailable':`${site.toUpperCase()} default artwork`}></span>{/if}
</div>
