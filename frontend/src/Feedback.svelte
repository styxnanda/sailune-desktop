<script lang="ts">
 import Icon from './Icon.svelte';
 import {friendlyError} from './motion';
 export let error='';
</script>
{#if error}<div class="feedback" role="alert"><Icon name="info"/><div><p>{friendlyError(error)}</p><details><summary>More information</summary><p class="diagnostic">{error}</p></details></div></div>{/if}
