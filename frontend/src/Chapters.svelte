<script lang="ts">
 import {fly} from 'svelte/transition';
 import {backOut} from 'svelte/easing';
 import {duration} from './motion';
 import Icon from './Icon.svelte';
 export let initial=1;
 export let total=0;
 export let busy=false;
 export let ondestination:(resume:boolean,launch:boolean,chapter?:number)=>void;
 let chapter=Math.max(1,initial),direction=1,expanded=false,jumping=false;
 let jump=chapter;
 let center:HTMLButtonElement,root:HTMLElement;
 function move(delta:number){const next=chapter+delta;if(next<1||(total>0&&next>total))return;direction=delta;chapter=next;expanded=false;}
 function go(){if(Number.isSafeInteger(jump)&&jump>0&&(!total||jump<=total)){direction=jump>=chapter?1:-1;chapter=jump;jumping=false;expanded=false;center?.focus();}}
 function outside(e:PointerEvent){if(root&&!root.contains(e.target as Node))expanded=false;}
</script>
<svelte:window onpointerdown={outside} onkeydowncapture={e=>{if(e.key==='Escape'&&expanded){e.preventDefault();e.stopPropagation();expanded=false;center.focus();}}}/>
<section bind:this={root} class="chapter-picker" aria-label="Chapter links">
 <div class="section-heading"><h3>Chapters</h3><button class="text-button" disabled={busy} onclick={()=>{jump=chapter;jumping=!jumping;expanded=false;}}>Jump to</button></div>
 {#if jumping}<form class="chapter-jump" onsubmit={e=>{e.preventDefault();go();}}><label class="sr-only" for="jump-chapter">Jump to chapter</label><input id="jump-chapter" type="number" min="1" max={total||undefined} step="1" required bind:value={jump}/><button class="primary" disabled={busy}>Go</button></form>{/if}
 <div class="chapter-carousel">
  <button class="chapter-arrow" disabled={busy||chapter<=1} aria-label="Previous chapter" onclick={()=>move(-1)}><Icon name="chevron-left" size={30}/></button>
  <div class="chapter-hub">
   {#if expanded}<div class="chapter-orbit" role="group" aria-label={`Chapter ${chapter} actions`} transition:fly={{y:18,duration:duration(280),easing:backOut}}>
    <button class="round" disabled={busy} aria-label={`Open chapter ${chapter}`} title="Open chapter" onclick={()=>ondestination(false,true,chapter)}><Icon name="external" size={25}/></button>
    <button class="round" disabled={busy} aria-label={`Get chapter ${chapter} link`} title="Get chapter link" onclick={()=>ondestination(false,false,chapter)}><Icon name="link" size={25}/></button>
   </div>{/if}
   <button bind:this={center} class="chapter-number" disabled={busy} aria-label={`Chapter ${chapter} actions`} aria-expanded={expanded} onclick={()=>expanded=!expanded} onkeydown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='Escape'&&expanded){e.stopPropagation();expanded=false;}}}>
    <span class="number-window" aria-hidden="true">{#key chapter}<span in:fly={{x:direction*30,duration:duration(240)}} out:fly={{x:direction*-30,duration:duration(160)}}>{chapter}</span>{/key}</span>
   </button>
  </div>
  <button class="chapter-arrow" disabled={busy||(total>0&&chapter>=total)} aria-label="Next chapter" onclick={()=>move(1)}><Icon name="chevron-right" size={30}/></button>
 </div>
</section>
