<script context="module" lang="ts">
 let nextId=0;
</script>
<script lang="ts">
 import {tick} from 'svelte';
 import {fly} from 'svelte/transition';
 import {duration} from './motion';
 import Icon from './Icon.svelte';
 export let value:any='';
 export let options:any[][]=[];
 export let label='';
 export let disabled=false;
 export let onchange:(value:any)=>void=()=>{};
 const id=`select-${++nextId}`;
 let trigger:HTMLButtonElement,menu:HTMLDivElement;
 let expanded=false,active=0,left=0,top=0,width=0,height=280;
 let typed='',typedAt=0;
 $: chosen=options.find(o=>Object.is(o[0],value))?.[1]??'Choose';
 function close(){expanded=false;}
 function position(){
  const r=trigger.getBoundingClientRect();
  width=Math.max(r.width,200);left=Math.max(12,Math.min(r.left,innerWidth-width-12));
  const below=innerHeight-r.bottom-16,above=r.top-16;
  height=Math.min(280,Math.max(below,above));
  top=below>=Math.min(280,options.length*44+12)?r.bottom+6:Math.max(12,r.top-Math.min(height,options.length*44+12)-6);
 }
 function portal(node:HTMLElement){(trigger.closest('dialog')||document.body).appendChild(node);return {destroy(){node.remove();}};}
 async function show(){
  if(disabled||trigger.matches(':disabled'))return;
  position();
  active=Math.max(0,options.findIndex(o=>Object.is(o[0],value)));expanded=true;await tick();reveal();
 }
 function reveal(){const option=menu?.querySelector<HTMLElement>(`#${id}-${active}`);if(!option)return;const top=option.offsetTop,bottom=top+option.offsetHeight;if(top<menu.scrollTop)menu.scrollTop=top;else if(bottom>menu.scrollTop+menu.clientHeight)menu.scrollTop=bottom-menu.clientHeight;}
 function choose(index:number){value=options[index][0];close();onchange(value);trigger.focus();}
 async function keydown(e:KeyboardEvent){
  if(e.key==='Escape'&&expanded){e.preventDefault();e.stopPropagation();close();return;}
  if(e.key==='Tab'){close();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();if(!expanded){await show();return;}
   active=e.key==='Home'?0:e.key==='End'?options.length-1:Math.max(0,Math.min(options.length-1,active+(e.key==='ArrowDown'?1:-1)));reveal();
  }else if((e.key==='Enter'||e.key===' ')&&expanded){e.preventDefault();choose(active);}
  else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey){
   typed=Date.now()-typedAt>600?e.key:typed+e.key;typedAt=Date.now();
   const index=options.findIndex(o=>String(o[1]).toLowerCase().startsWith(typed.toLowerCase()));
   if(index>=0){e.preventDefault();if(!expanded)await show();active=index;reveal();}
  }
 }
 function outside(e:PointerEvent){if(expanded&&!trigger.contains(e.target as Node)&&!menu?.contains(e.target as Node))close();}
 function scroll(e:Event){if(expanded&&!menu?.contains(e.target as Node))position();}
</script>
<svelte:window onpointerdown={outside} onresize={close}/>
<svelte:document onscrollcapture={scroll}/>
<button bind:this={trigger} type="button" class="select-trigger" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={expanded} aria-controls={id} aria-activedescendant={expanded?`${id}-${active}`:undefined} {disabled} onkeydown={keydown} onclick={()=>expanded?close():show()}><span>{chosen}</span><Icon name="chevron" size={21}/></button>
{#if expanded}
 <div bind:this={menu} use:portal id={id} class="select-menu" role="listbox" aria-label={label} style:left={`${left}px`} style:top={`${top}px`} style:width={`${width}px`} style:max-height={`${height}px`} transition:fly={{y:-4,duration:duration(140)}}>
  {#each options as option,i}<div id={`${id}-${i}`} class="select-option" class:active={active===i} role="option" aria-selected={Object.is(value,option[0])} tabindex="-1" onpointerdown={e=>e.preventDefault()} onpointermove={()=>active=i} onclick={e=>{e.preventDefault();choose(i);}} onkeydown={e=>{if(e.key==='Enter')choose(i);}}><span>{option[1]}</span>{#if Object.is(value,option[0])}<Icon name="check" size={19}/>{/if}</div>{/each}
 </div>
{/if}
