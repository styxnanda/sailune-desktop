<script lang="ts">
 import {defaultFilter,statuses,statusLabel,type Filter} from './api';
 import Sheet from './Sheet.svelte';
 import Icon from './Icon.svelte';
 export let filter:Filter;
 export let onclose:()=>void;
 export let onapply:(filter:Filter)=>void;
 let draft=structuredClone(filter);
 const sorts=[['added','When I saved it'],['last-read','When I last read it'],['updated','Recently edited'],['source-updated','Story updates'],['title','Title'],['author','Author'],['rating','My rating'],['words','Story length'],['progress','Reading progress']];
</script>
<Sheet title="Find your next chapter." subtitle="A mood, a fandom, a familiar favorite." {onclose}>
 <form onsubmit={(e)=>{e.preventDefault();onapply(draft);}}>
  <div class="form-grid"><label>Shelf<select bind:value={draft.Status}><option value="">All stories</option>{#each statuses as s}<option value={s}>{statusLabel(s)}</option>{/each}</select></label><label>Website<select bind:value={draft.Site}><option value="">Anywhere</option><option value="ao3">Archive of Our Own</option><option value="ffn">FanFiction.net</option></select></label></div>
  <div class="form-grid">{#each [['Author','Author'],['Fandom','Fandom'],['Tag','My tag'],['SourceTag','Story tag'],['Language','Language']] as [key,label]}<label>{label}<input value={String(draft[key as keyof Filter])} oninput={(e)=>draft={...draft,[key]:e.currentTarget.value}}/></label>{/each}<label>Story ending<select bind:value={draft.Complete}><option value={null}>Either way</option><option value={true}>Finished stories</option><option value={false}>Still being written</option></select></label></div>
  <label class="toggle"><input type="checkbox" bind:checked={draft.Unread}/><span>Something left to read<small>Only stories with unread chapters.</small></span></label>
  <details class="disclosure"><summary>Length & rating<Icon name="plus"/></summary><div class="form-grid"><label>At least this many words<input type="number" min="0" bind:value={draft.MinWords}/></label><label>No more than this many words<input type="number" min="0" bind:value={draft.MaxWords}/></label><label>My rating<select bind:value={draft.MinRating}><option value={0}>Any rating</option>{#each [1,2,3,4,5] as n}<option value={n}>{n} stars or more</option>{/each}</select></label></div><p class="hint">Leave a word count at zero for any length.</p></details>
  <details class="disclosure" open><summary>Arrange my stories<Icon name="plus"/></summary><div class="form-grid"><label>Sort by<select bind:value={draft.Sort}>{#each sorts as [id,label]}<option value={id}>{label}</option>{/each}</select></label><label>Order<select bind:value={draft.Desc}><option value={true}>{['title','author'].includes(draft.Sort)?'Z to A':['words','rating','progress'].includes(draft.Sort)?'Highest first':'Newest first'}</option><option value={false}>{['title','author'].includes(draft.Sort)?'A to Z':['words','rating','progress'].includes(draft.Sort)?'Lowest first':'Oldest first'}</option></select></label><label>Stories on a page<select bind:value={draft.Limit}>{#each [20,50,100,200] as n}<option value={n}>{n} stories</option>{/each}</select></label><label>Start after this many stories<input type="number" min="0" bind:value={draft.Offset}/></label></div></details>
  <div class="form-actions"><button type="button" class="quiet" onclick={()=>draft=defaultFilter()}>Reset everything</button><button class="primary" type="submit">Find my stories<Icon name="arrow"/></button></div>
 </form>
</Sheet>
