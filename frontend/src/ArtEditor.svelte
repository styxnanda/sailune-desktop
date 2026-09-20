<script lang="ts">
 import {feature,pick,previewArtwork,type Config} from './api';
 import Artwork from './Artwork.svelte';
 export let config:Config;export let id:number;export let site:string;
 export let onchange:()=>void=()=>{};
 let role:'cover'|'background'='cover',path='',preview='',x=.5,y=.5,error='',busy=false,revision=0;
 async function run(task:()=>Promise<void>){busy=true;error='';try{await task();}catch(e){error=String(e);}finally{busy=false;}}
 async function frame(){preview=await previewArtwork(path,role,x,y);}
</script>
<details class="disclosure"><summary>Artwork</summary>
 <p class="hint">Choose a portrait cover and a separate horizontal background. Sailune saves optimized copies. Transparent images use a white background.</p>
 <label>Artwork slot<select bind:value={role} disabled={busy} onchange={()=>{path='';preview='';x=.5;y=.5;}}><option value="cover">Portrait cover · 2:3</option><option value="background">Horizontal background</option></select></label>
 <div class="art-editor-preview">{#if preview}<img src={preview} alt="Upload preview" style:object-position={`${x*100}% ${y*100}%`} class:portrait={role==='cover'}/>{:else}<Artwork {config} {id} {site} {role} {revision} small={false}/>{/if}</div>
 {#if path}<label>Horizontal focal point<input type="range" min="0" max="1" step="0.05" bind:value={x} disabled={busy}/></label><label>Vertical focal point<input type="range" min="0" max="1" step="0.05" bind:value={y} disabled={busy}/></label><button disabled={busy} onclick={()=>run(frame)}>Preview framing</button>{/if}
 {#if error}<p role="alert">{error}</p>{/if}
 <div class="button-row"><button disabled={busy} onclick={()=>run(async()=>{const p=await pick('image');if(p){path=p;x=.5;y=.5;await frame();}})}>Choose image</button><button disabled={busy||!path} onclick={()=>run(async()=>{await feature(config,{action:'artwork-set',id,role,path,x,y});path='';preview='';revision++;onchange();})}>Save artwork</button><button disabled={busy} onclick={()=>run(async()=>{await feature(config,{action:'artwork-remove',id,role});path='';preview='';revision++;onchange();})}>Remove artwork</button></div>
</details>
