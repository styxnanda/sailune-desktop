<script lang="ts">
 import Icon from './Icon.svelte';
 export let title='Untitled story';
 export let author='Unknown author';
 export let id=0;
 export let site='ao3';
</script>
<div class="book-cover variation-{id%4}">
 <span class="cover-site">{site==='ao3'?'ARCHIVE OF OUR OWN':'FANFICTION.NET'}</span>
 <div class="cover-ornament" aria-hidden="true"><span></span><span></span><Icon name={id%2?'moon':'book'} size={40}/></div>
 <h3>{title}</h3>
 <span class="cover-author">{author}</span>
 <span class="cover-rule" aria-hidden="true"></span>
</div>
