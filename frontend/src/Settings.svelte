<script lang="ts">
 import {call,open,pick,confirmAction,type Config,type Session} from './api';
 import Sheet from './Sheet.svelte';
 import Icon from './Icon.svelte';
 import Select from './Select.svelte';
 import {theme} from './theme';
 export let config:Config;
 export let busy=false;
 export let error='';
 export let message='';
 export let onclose:()=>void;
 export let run:(task:()=>Promise<void>)=>Promise<void>;
 export let notify:(message:string)=>void;
 export let onchange:(config:Config)=>Promise<void>;
 let section='', draft={...config},site='ao3',browser='chromium/chrome',profile='',consent=false,session:Session|null=null,transferPath='',merge=true;
 const names:Record<string,string>={connect:'Connected websites',backup:'Backup',import:'Import',storage:'Library',theme:'Customize theme'};
 const filename=(path:string)=>path.split(/[\\/]/).pop()||path;
 const payload=()=>({Config:config,Site:site});
 async function choose(kind:string,set:(s:string)=>void){const p=await pick(kind);if(p)set(p);}
 async function auth(action:string,path=''){
  session=await call<Session|null>(action,{...payload(),Path:path,Browser:browser+(profile?':'+profile:''),Consent:consent});
  notify(action==='session-status'?'Connection checked.':'Connected.');
 }
</script>
<Sheet title={names[section]||'Settings'}  {busy} {error} {message} {onclose}>
 {#if section}<button class="text-button back-link" disabled={busy} onclick={()=>section=''}><Icon name="back"/>Settings</button>{/if}
 <fieldset disabled={busy}>
 {#if !section}
  <div class="preference-list">
   {#each [['connect','link','Connected websites'],['backup','download','Save a backup'],['import','upload','Import collection'],['storage','folder','Library'],['theme','moon','Customize theme']] as [id,icon,title]}
    <button class="preference" onclick={()=>section=id}><span class="preference-icon"><Icon name={icon} size={30}/></span><span><strong>{title}</strong></span><Icon name="arrow"/></button>
   {/each}
  </div><p class="quiet-caption">Sailune · 0.1.0</p>
 {:else if section==='theme'}
  <div class="theme-choices"><button class="theme-choice" class:chosen={$theme==='light'} aria-pressed={$theme==='light'} onclick={()=>theme.set('light')}><span class="theme-preview light-preview"><i></i><i></i><i></i></span><span>Light{#if $theme==='light'}<Icon name="check"/>{/if}</span></button><button class="theme-choice" class:chosen={$theme==='dark'} aria-pressed={$theme==='dark'} onclick={()=>theme.set('dark')}><span class="theme-preview dark-preview"><i></i><i></i><i></i></span><span>Dark{#if $theme==='dark'}<Icon name="check"/>{/if}</span></button></div>
 {:else if section==='connect'}
  <div class="site-choices">{#each [['ao3','Archive of Our Own'],['ffn','FanFiction.net']] as [id,label]}<button class:chosen={site===id} aria-pressed={site===id} onclick={()=>{site=id;session=null;consent=false;}}>{label}</button>{/each}</div>
  <section class="connection-step"><span class="step-number">01</span><div><h3>Sign in</h3><p>Sign in using your browser first.</p><button onclick={()=>run(()=>open('login',payload()))}>Open website<Icon name="external"/></button></div></section>
  <section class="connection-step"><span class="step-number">02</span><div><h3>Connect browser</h3><label>Browser<Select label="Browser" bind:value={browser} options={[[ 'chromium/chrome','Chrome'],['chromium/edge','Edge'],['chromium/brave','Brave'],['chromium/chromium','Chromium'],['chromium/vivaldi','Vivaldi'],['chromium/opera','Opera'],['gecko/firefox','Firefox']]}/></label>
   <details class="disclosure"><summary>Browser profile<Icon name="plus"/></summary><label>Profile name or folder<input bind:value={profile} placeholder="For example, Profile 1"/></label><button class="quiet" onclick={()=>run(()=>choose('directory',p=>profile=p))}><Icon name="folder"/>Choose profile folder</button></details>
   <label class="toggle"><input type="checkbox" bind:checked={consent}/><span>Allow access to this website’s sign-in<small>Sign-in cookies stay on this device.</small></span></label>
   <button class="primary" disabled={!consent} onclick={()=>run(()=>auth('session-browser'))}>Connect account<Icon name="arrow"/></button>
  </div></section>
  <div class="connection-status"><Icon name={session?.configured?'check':'link'}/><div><strong>{session?session.configured?'Connected.':'Not connected.':'Connection status'}</strong>{#if session}<p>{session.usable_cookies} active sign-in cookies. The website may still ask you to sign in again.</p>{/if}</div><button class="text-button" onclick={()=>run(()=>auth('session-status'))}>Check</button></div>
  <details class="disclosure"><summary>Other methods<Icon name="plus"/></summary><p class="hint">You can also use a sign-in file exported from your browser (cookies.txt), or move an older Sailune sign-in.</p><div class="button-row"><button disabled={!consent} onclick={()=>run(async()=>{const p=await pick('file');if(p)await auth('session-file',p);})}><Icon name="upload"/>Use a sign-in file</button><button onclick={()=>run(async()=>{const p=await pick('directory');if(p&&await confirmAction('Move this older sign-in to Sailune? It will be stored securely and the old unprotected file will be removed.')){await call('session-migrate',{...payload(),Path:p,Consent:true});notify('Sign-in imported.');}})}>Move an older sign-in</button></div><p class="hint">If a browser won’t connect, try a sign-in file or another browser. Some websites may still ask for a browser check.</p></details>
  <button class="text-button danger" onclick={()=>run(async()=>{if(await confirmAction('Disconnect this website from Sailune? You’ll stay signed in to your browser.')){await call('session-clear',{...payload(),Consent:true});session=null;notify('Website disconnected.');}})}>Disconnect website</button>
 {:else if section==='backup'}
  <p class="hint">Export bookmarks and notes. Website sign-ins are excluded.</p><button class="primary roomy" onclick={()=>run(async()=>{const p=await pick('export');if(p){await call('export',{Config:config,Path:p});notify('Your backup is saved.');}})}>Save a backup<Icon name="download"/></button>
 {:else if section==='import'}
  <p class="hint">Import a Sailune backup or an older collection.</p>
  <button class="file-choice" onclick={()=>run(()=>choose('file',p=>transferPath=p))}><Icon name="folder" size={30}/><span>{transferPath?filename(transferPath):'Choose backup'}</span><Icon name="plus"/></button>
  <label class="toggle"><input type="checkbox" bind:checked={merge}/><span>Merge with current library<small>Duplicates are skipped.</small></span></label>{#if !merge}<p class="hint">Restoring a whole collection needs an empty library. You can choose one in Library. Your original backup is kept.</p>{/if}
  <button class="primary roomy" disabled={!transferPath} onclick={()=>run(async()=>{const r=await call<{imported:number;skipped:number}>('import',{Config:config,Path:transferPath,Merge:merge});notify(`${r.imported} imported.${r.skipped?` ${r.skipped} skipped.`:''}`);})}>Import<Icon name="arrow"/></button>
 {:else if section==='storage'}
  <h3>Your library</h3><p class="hint">Stored on this device.</p><div class="file-location"><Icon name="book" size={30}/><span>{filename(draft.Data)||'Your collection'}</span></div>
  <div class="button-row"><button onclick={()=>run(()=>choose('database',p=>draft.Data=p))}>Choose a library</button><button onclick={()=>run(()=>choose('new-database',p=>draft.Data=p))}><Icon name="plus"/>New library</button></div>
  <details class="disclosure"><summary>File locations<Icon name="plus"/></summary><label>Library file<input bind:value={draft.Data}/></label><label>Sign-in folder<div class="input-action"><input bind:value={draft.Sessions}/><button aria-label="Choose sign-in folder" onclick={()=>run(()=>choose('directory',p=>draft.Sessions=p))}><Icon name="folder"/></button></div></label><p class="hint">Keep these on this device. To move stories between devices, use a backup.</p></details>
  <details class="disclosure"><summary>Website compatibility<Icon name="plus"/></summary><label>Custom browser identifier<input bind:value={draft.UserAgent} placeholder="Use Sailune’s default"/></label><p class="hint">Some websites need a particular browser identifier. Leave this empty unless you need a custom one.</p></details>
  <button class="primary" onclick={()=>run(async()=>{await onchange({...draft});notify('Preferences applied.');})}>Apply<Icon name="check"/></button><p class="hint">Location preferences apply until you close Sailune.</p>
 {/if}
 </fieldset>
</Sheet>
