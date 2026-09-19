<script lang="ts">
 import {onMount} from 'svelte';
 import {fly} from 'svelte/transition';
 import {duration} from './motion';
 import {cancel} from './api';
 import Icon from './Icon.svelte';
 import Feedback from './Feedback.svelte';
 export let title='';
 export let subtitle='';
 export let busy=false;
 export let error='';
 export let message='';
 export let wide=false;
 export let onclose:()=>void;
 let dialog:HTMLDialogElement;
 onMount(()=>{
  const previous=document.activeElement as HTMLElement|null;
  dialog.showModal();
  return()=>{dialog.close();setTimeout(()=>{if(previous?.isConnected&&!document.querySelector('dialog[open]'))previous.focus();},duration(240));};
 });
</script>
<dialog bind:this={dialog} class="sheet" class:wide oncancel={(e)=>{e.preventDefault();if(!busy)onclose();}} onclick={(e)=>{if(e.target===dialog&&!busy){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onclose();}}} transition:fly={{y:80,duration:duration(360)}}>
 <div class="sheet-inner">
  <button class="round close-sheet" onclick={onclose} disabled={busy} aria-label="Close"><Icon name="close" size={26}/></button>
  <header class="sheet-heading"><h2>{title}</h2>{#if subtitle}<p>{subtitle}</p>{/if}</header>
  <Feedback {error}/>
  {#if message}<p class="sheet-message" role="status"><Icon name="check"/>{message}</p>{/if}
  {#if busy}<div class="inline-progress" role="status"><span class="spinner"></span>Working…<button class="text-button" onclick={()=>void cancel()}>Stop</button></div>{/if}
  <slot/>
 </div>
</dialog>
