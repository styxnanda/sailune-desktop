<script lang="ts">
 import {feature,type Config,type Collection} from './api';
 export let config:Config;export let id:number;
 let collections:Collection[]=[],selected='',error='',message='',busy=false;
 async function load(){busy=true;error='';try{collections=(await feature<Collection[]>(config,{action:'collections'})).filter(c=>c.kind==='manual');}catch(e){error=String(e);}finally{busy=false;}}
 async function assign(remove:boolean){busy=true;error='';try{await feature(config,{action:'membership',collection_id:selected,ids:[id],remove});message=remove?'Removed from collection.':'Added to collection.';}catch(e){error=String(e);}finally{busy=false;}}
</script>
<details class="disclosure" ontoggle={e=>{if(e.currentTarget.open)void load();}}><summary>Add to collection</summary>
 {#if error}<p role="alert">{error}</p>{/if}{#if message}<p role="status">{message}</p>{/if}
 {#if !collections.length}<p class="hint">Create a manual collection from Manage collections in your library.</p>{:else}<label>Collection<select bind:value={selected} disabled={busy}><option value="">Choose collection…</option>{#each collections as c}<option value={c.id}>{c.name}</option>{/each}</select></label><div class="button-row"><button disabled={busy||!selected} onclick={()=>assign(false)}>Add</button><button disabled={busy||!selected} onclick={()=>assign(true)}>Remove from collection</button></div>{/if}
</details>
