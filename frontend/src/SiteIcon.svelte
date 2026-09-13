<script lang="ts">
 export let site:string;
 $: name=site==='ao3'?'Archive of Our Own':site==='ffn'?'FanFiction.net':site;
</script>
<span class="site-icon" title={name}>{#if site==='ao3'||site==='ffn'}<img src={`/sites/${site}.ico`} alt={name} width="24" height="24"/>{:else}<span>{name}</span>{/if}</span>
