<script lang="ts">
 import {onMount} from 'svelte';
 import {call,feature,emptyRules,defaultFilter,statuses,statusLabel,type Config,type Collection,type Bookmark,type Rules} from './api';
 import Sheet from './Sheet.svelte';
 export let config:Config;export let onclose:()=>void;export let onchanged:()=>void;
 let collections:Collection[]=[],current:Collection|null=null,name='',kind:'manual'|'smart'='manual',rules=emptyRules(),personal='',source='',busy=false,error='',rows:Bookmark[]=[],chosen:number[]=[],query='',offset=0,total=0,viewMembers=false;
 let personalTags:string[]=[],sourceTags:string[]=[],fandoms:string[]=[];
 async function run(fn:()=>Promise<void>){busy=true;error='';try{await fn();}catch(e){error=String(e);}finally{busy=false;}}
 async function reload(){collections=await feature(config,{action:'collections'});}
 onMount(()=>void run(async()=>{await reload();personalTags=await feature(config,{action:'tags',kind:'tag'});sourceTags=await feature(config,{action:'tags',kind:'source-tag'});fandoms=await feature(config,{action:'tags',kind:'fandom'});}));
 function edit(c:Collection|null){current=c;name=c?.name||'';kind=c?.kind||'manual';rules=structuredClone(c?.rules||emptyRules());personal=rules.personal.tags?.join('\n')||'';source=rules.source.tags?.join('\n')||'';rows=[];chosen=[];offset=0;total=0;}
 function builtRules():Rules{return {...rules,personal:{...rules.personal,tags:personal.split('\n').map(s=>s.trim()).filter(Boolean)},source:{...rules.source,tags:source.split('\n').map(s=>s.trim()).filter(Boolean)}};}
 async function preview(reset=true){if(reset){offset=0;chosen=[];}const filter={...defaultFilter(),Query:query,Limit:20,Offset:offset,...(viewMembers&&current?{Collection:current.id}:{Rules:builtRules()})};rows=await call('list',{Config:config,Filter:filter});total=await feature(config,{action:'count',filter});}
 async function save(){current=await feature(config,{action:'collection-save',collection:{id:current?.id||'',name,kind,rules:builtRules()}});await reload();onchanged();}
</script>
<Sheet title="Manage collections" {busy} {error} {onclose} wide>
 <div class="collection-manager">
  <nav aria-label="Collections"><button disabled={busy} onclick={()=>edit(null)}>New collection</button>{#each collections as c}<button disabled={busy} class:chosen={current?.id===c.id} onclick={()=>edit(c)}>{c.name} · {c.count}{c.kind==='smart'?' · Automatic':''}</button>{/each}</nav>
  <section><label>Name<input bind:value={name} maxlength="200" disabled={busy}/></label><label>Type<select bind:value={kind} disabled={busy||!!current}><option value="manual">Manual</option><option value="smart">Automatic · saved rules</option></select></label>
   <details class="disclosure" open={kind==='smart'}><summary>{kind==='smart'?'Matching rules':'Find stories by tags'}</summary>
    <p class="hint">Exact tag matches. Conditions combine with AND. Automatic membership updates when local story details change.</p>
    <label>Personal tags · one per line<textarea bind:value={personal} rows="3"></textarea></label><label>Add a personal tag<select aria-label="Personal tag suggestions" onchange={e=>{if(e.currentTarget.value)personal+=(personal?'\n':'')+e.currentTarget.value;e.currentTarget.value='';}}><option value="">Choose tag…</option>{#each personalTags as t}<option>{t}</option>{/each}</select></label><label><input type="checkbox" bind:checked={rules.personal.all}/>Match all personal tags (otherwise any)</label>
    <label>Website tags · one per line<textarea bind:value={source} rows="3"></textarea></label><label>Add a website tag<select aria-label="Website tag suggestions" onchange={e=>{if(e.currentTarget.value)source+=(source?'\n':'')+e.currentTarget.value;e.currentTarget.value='';}}><option value="">Choose tag…</option>{#each sourceTags as t}<option>{t}</option>{/each}</select></label><label><input type="checkbox" bind:checked={rules.source.all}/>Match all website tags (otherwise any)</label>
    <label>Website<select bind:value={rules.site}><option value="">All websites</option><option value="ao3">AO3</option><option value="ffn">FFN</option></select></label><label>Reading status<select bind:value={rules.status}><option value="">All statuses</option>{#each statuses as s}<option value={s}>{statusLabel(s)}</option>{/each}</select></label><label>Fandom<input bind:value={rules.fandom} list="collection-fandoms"/></label><datalist id="collection-fandoms">{#each fandoms as f}<option value={f}></option>{/each}</datalist>
   </details>
   <div class="button-row"><button disabled={busy||!name.trim()} onclick={()=>run(save)}>Save collection</button>{#if current}<button disabled={busy} onclick={()=>run(async()=>{if(!await window.go!.main.App.Confirm('Delete this collection? Stories remain in your library.'))return;await feature(config,{action:'collection-delete',collection_id:current!.id});edit(null);await reload();onchanged();})}>Delete collection</button>{/if}</div>
   <label>Search stories<input bind:value={query}/></label><div class="button-row"><button disabled={busy} onclick={()=>run(async()=>{viewMembers=false;await preview();})}>Preview matching stories</button>{#if current}<button disabled={busy} onclick={()=>run(async()=>{viewMembers=true;await preview();})}>View collection</button>{/if}</div>
   <p class="hint">{total} matching stories</p>
   {#each rows as b}<label class="collection-story"><input type="checkbox" checked={chosen.includes(b.id)} disabled={kind==='smart'} onchange={e=>chosen=e.currentTarget.checked?[...chosen,b.id]:chosen.filter(id=>id!==b.id)}/><span>{b.title||'Untitled story'}<small>{b.author}</small></span></label>{/each}
   {#if rows.length||offset}<div class="button-row"><button disabled={busy||offset===0} onclick={()=>run(async()=>{offset=Math.max(0,offset-20);await preview(false);})}>Previous</button><button disabled={busy||offset+20>=total} onclick={()=>run(async()=>{offset+=20;await preview(false);})}>Next</button></div>{/if}
   {#if current&&kind==='manual'}<div class="button-row"><button disabled={busy||!rows.length} onclick={()=>chosen=rows.map(b=>b.id)}>Select page</button><button disabled={busy||!chosen.length} onclick={()=>run(async()=>{await feature(config,{action:'membership',collection_id:current!.id,ids:chosen,remove:viewMembers});chosen=[];await reload();await preview(false);onchanged();})}>{viewMembers?'Remove selected from collection':'Add selected to collection'}</button></div>{/if}
  </section>
 </div>
</Sheet>
