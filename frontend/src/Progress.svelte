<script lang="ts">
 import Icon from './Icon.svelte';
 export let chapter=0;
 export let total=0;
 export let title='';
 export let disabled=false;
 export let saving=false;
 export let onchange:(chapter:number)=>Promise<void>;
 let input:HTMLInputElement;
 async function commit(value:number){
  if(disabled||!Number.isSafeInteger(value)||value<0){input.value=String(chapter);return;}
  if(value!==chapter)await onchange(value);
  input.value=String(chapter);
 }
</script>
<div class="card-progress" role="group" aria-label={`Reading progress for ${title}`} aria-busy={saving}>
 <button class="progress-step" disabled={disabled||chapter===0} aria-label={`Previous read chapter for ${title}`} title="One chapter back" onclick={()=>commit(chapter-1)}><Icon name="back" size={20}/></button>
 <div class="progress-value"><input bind:this={input} aria-label={`Last chapter read for ${title}`} type="number" min="0" step="1" value={chapter} {disabled} onfocus={e=>e.currentTarget.select()} onchange={e=>commit(e.currentTarget.valueAsNumber)} onkeydown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape'){e.currentTarget.value=String(chapter);e.currentTarget.blur();}}}/><span>{total?`/ ${total}`:'read'}</span></div>
 <button class="progress-step" {disabled} aria-label={`Next read chapter for ${title}`} title="Mark next chapter read" onclick={()=>commit(chapter+1)}>{#if saving}<span class="spinner"></span>{:else}<Icon name="arrow" size={20}/>{/if}</button>
</div>
