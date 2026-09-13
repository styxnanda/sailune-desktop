<script lang="ts">
 import {defaultFilter,statuses,statusLabel,type Filter} from './api';
 import Sheet from './Sheet.svelte';
 import Icon from './Icon.svelte';
 import Select from './Select.svelte';
 export let filter:Filter;
 export let onclose:()=>void;
 export let onapply:(filter:Filter)=>void;
 let draft=structuredClone(filter);
 const sorts=[['added','Date added'],['last-read','Last read'],['updated','Recently edited'],['source-updated','Story updates'],['title','Title'],['author','Author'],['rating','My rating'],['words','Story length'],['progress','Reading progress']];
</script>
<Sheet title="Filters" {onclose}>
 <form onsubmit={(e)=>{e.preventDefault();onapply(draft);}}>
  <div class="form-grid"><label>Shelf<Select label="Shelf" bind:value={draft.Status} options={[['','All bookmarks'],...statuses.map(s=>[s,statusLabel(s)])]}/></label><label>Website<Select label="Website" bind:value={draft.Site} options={[['','All websites'],['ao3','Archive of Our Own'],['ffn','FanFiction.net']]}/></label></div>
  <div class="form-grid">{#each [['Author','Author'],['Fandom','Fandom'],['Tag','My tag'],['SourceTag','Story tag'],['Language','Language']] as [key,label]}<label>{label}<input value={String(draft[key as keyof Filter])} oninput={(e)=>draft={...draft,[key]:e.currentTarget.value}}/></label>{/each}<label>Completion<Select label="Completion" bind:value={draft.Complete} options={[[null,'Any'],[true,'Finished stories'],[false,'Still being written']]}/></label></div>
  <label class="toggle"><input type="checkbox" bind:checked={draft.Unread}/><span>Unread chapters</span></label>
  <details class="disclosure"><summary>Length & rating<Icon name="plus"/></summary><div class="form-grid"><label>Minimum words<input type="number" min="0" bind:value={draft.MinWords}/></label><label>Maximum words<input type="number" min="0" bind:value={draft.MaxWords}/></label><label>My rating<Select label="My rating" bind:value={draft.MinRating} options={[[0,'Any rating'],...[1,2,3,4,5].map(n=>[n,`${n} stars or more`])]}/></label></div><p class="hint">Leave a word count at zero for any length.</p></details>
  <details class="disclosure" open><summary>Sort & display<Icon name="plus"/></summary><div class="form-grid"><label>Sort by<Select label="Sort by" bind:value={draft.Sort} options={sorts}/></label><label>Order<Select label="Order" bind:value={draft.Desc} options={[[true,['title','author'].includes(draft.Sort)?'Z to A':['words','rating','progress'].includes(draft.Sort)?'Highest first':'Newest first'],[false,['title','author'].includes(draft.Sort)?'A to Z':['words','rating','progress'].includes(draft.Sort)?'Lowest first':'Oldest first']]}/></label><label>Per page<Select label="Per page" bind:value={draft.Limit} options={[20,50,100,200].map(n=>[n,`${n} stories`])}/></label><label>Skip bookmarks<input type="number" min="0" bind:value={draft.Offset}/></label></div></details>
  <div class="form-actions"><button type="button" class="quiet" onclick={()=>draft=defaultFilter()}>Reset</button><button class="primary" type="submit">Apply filters<Icon name="arrow"/></button></div>
 </form>
</Sheet>
