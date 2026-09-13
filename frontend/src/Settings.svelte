<script lang="ts">
 import {call,open,pick,confirmAction,type Config,type Session} from './api';
 import Sheet from './Sheet.svelte';
 import Icon from './Icon.svelte';
 export let config:Config;
 export let busy=false;
 export let error='';
 export let message='';
 export let onclose:()=>void;
 export let run:(task:()=>Promise<void>)=>Promise<void>;
 export let notify:(message:string)=>void;
 export let onchange:(config:Config)=>Promise<void>;
 let section='', draft={...config},site='ao3',browser='chromium/chrome',profile='',consent=false,session:Session|null=null,transferPath='',merge=true;
 const names:Record<string,string>={connect:'Your connected worlds.',backup:'Keep a little peace of mind.',import:'Bring your stories along.',storage:'A home for your collection.'};
 const filename=(path:string)=>path.split(/[\\/]/).pop()||path;
 const payload=()=>({Config:config,Site:site});
 async function choose(kind:string,set:(s:string)=>void){const p=await pick(kind);if(p)set(p);}
 async function auth(action:string,path=''){
  session=await call<Session|null>(action,{...payload(),Path:path,Browser:browser+(profile?':'+profile:''),Consent:consent});
  notify(action==='session-status'?'Connection checked.':'Your sign-in is saved.');
 }
</script>
<Sheet title={names[section]||'Your space.'} subtitle={section?'':'A few thoughtful things to make yourself at home.'} {busy} {error} {message} {onclose}>
 {#if section}<button class="text-button back-link" disabled={busy} onclick={()=>section=''}><Icon name="back"/>Your space</button>{/if}
 <fieldset disabled={busy}>
 {#if !section}
  <div class="preference-list">
   {#each [['connect','link','Connected websites','Keep your favorite worlds within reach.'],['backup','download','Save a backup','A safe copy of every story and note.'],['import','upload','Bring in a collection','Welcome your stories from another device.'],['storage','folder','Library & preferences','Choose where your collection feels at home.']] as [id,icon,title,description]}
    <button class="preference" onclick={()=>section=id}><span class="preference-icon"><Icon name={icon} size={30}/></span><span><strong>{title}</strong><small>{description}</small></span><Icon name="arrow"/></button>
   {/each}
  </div><p class="quiet-caption">Sailune · 0.1.0<br/>A little space for the stories you love.</p>
 {:else if section==='connect'}
  <div class="site-choices">{#each [['ao3','Archive of Our Own'],['ffn','FanFiction.net']] as [id,label]}<button class:chosen={site===id} aria-pressed={site===id} onclick={()=>{site=id;session=null;consent=false;}}>{label}</button>{/each}</div>
  <section class="connection-step"><span class="step-number">01</span><div><h3>Say hello to your account.</h3><p>Sign in on the website in your usual browser. Come back here when you’re ready.</p><button onclick={()=>run(()=>open('login',payload()))}>Open website<Icon name="external"/></button></div></section>
  <section class="connection-step"><span class="step-number">02</span><div><h3>Bring your sign-in with you.</h3><label>Your browser<select bind:value={browser}>{#each [['chromium/chrome','Chrome'],['chromium/edge','Edge'],['chromium/brave','Brave'],['chromium/chromium','Chromium'],['chromium/vivaldi','Vivaldi'],['chromium/opera','Opera'],['gecko/firefox','Firefox']] as [id,name]}<option value={id}>{name}</option>{/each}</select></label>
   <details class="disclosure"><summary>Use a different browser profile<Icon name="plus"/></summary><label>Profile name or folder<input bind:value={profile} placeholder="For example, Profile 1"/></label><button class="quiet" onclick={()=>run(()=>choose('directory',p=>profile=p))}><Icon name="folder"/>Choose profile folder</button></details>
   <label class="toggle"><input type="checkbox" bind:checked={consent}/><span>Let Sailune use my sign-in for this website<small>Only this website’s sign-in cookies are copied and stored securely on your device.</small></span></label>
   <button class="primary" disabled={!consent} onclick={()=>run(()=>auth('session-browser'))}>Connect account<Icon name="arrow"/></button>
  </div></section>
  <div class="connection-status"><Icon name={session?.configured?'check':'link'}/><div><strong>{session?session.configured?'Your sign-in is saved.':'No sign-in saved yet.':'Already connected?'}</strong>{#if session}<p>{session.usable_cookies} active sign-in cookies. The website may still ask you to sign in again.</p>{/if}</div><button class="text-button" onclick={()=>run(()=>auth('session-status'))}>Check</button></div>
  <details class="disclosure"><summary>Other ways to connect<Icon name="plus"/></summary><p class="hint">You can also use a sign-in file exported from your browser (cookies.txt), or move an older Sailune sign-in.</p><div class="button-row"><button disabled={!consent} onclick={()=>run(async()=>{const p=await pick('file');if(p)await auth('session-file',p);})}><Icon name="upload"/>Use a sign-in file</button><button onclick={()=>run(async()=>{const p=await pick('directory');if(p&&await confirmAction('Move this older sign-in to Sailune? It will be stored securely and the old unprotected file will be removed.')){await call('session-migrate',{...payload(),Path:p,Consent:true});notify('Your older sign-in is ready.');}})}>Move an older sign-in</button></div><p class="hint">If a browser won’t connect, try a sign-in file or another browser. Some websites may still ask for a browser check.</p></details>
  <button class="text-button danger" onclick={()=>run(async()=>{if(await confirmAction('Disconnect this website from Sailune? You’ll stay signed in to your browser.')){await call('session-clear',{...payload(),Consent:true});session=null;notify('Website disconnected.');}})}>Disconnect website</button>
 {:else if section==='backup'}
  <div class="ritual-icon"><Icon name="download" size={64}/></div><p class="lead">All your stories. All your notes.<br/>One copy to keep somewhere safe.</p><p class="hint">Save it on another device or in your cloud storage. Your website sign-ins stay private on this device.</p><button class="primary roomy" onclick={()=>run(async()=>{const p=await pick('export');if(p){await call('export',{Config:config,Path:p});notify('Your backup is saved.');}})}>Save a backup<Icon name="download"/></button>
 {:else if section==='import'}
  <div class="ritual-icon"><Icon name="upload" size={64}/></div><p class="lead">Your collection can come with you.</p><p class="hint">Choose a Sailune backup, including a collection saved with an older version.</p>
  <button class="file-choice" onclick={()=>run(()=>choose('file',p=>transferPath=p))}><Icon name="folder" size={30}/><span>{transferPath?filename(transferPath):'Choose your backup'}</span><Icon name="plus"/></button>
  <label class="toggle"><input type="checkbox" bind:checked={merge}/><span>Keep the stories I already have<small>New stories join your collection. Stories you’ve already saved are skipped.</small></span></label>{#if !merge}<p class="hint">Restoring a whole collection needs an empty library. You can choose one in Library & preferences. Your original backup is kept.</p>{/if}
  <button class="primary roomy" disabled={!transferPath} onclick={()=>run(async()=>{const r=await call<{imported:number;skipped:number}>('import',{Config:config,Path:transferPath,Merge:merge});notify(`${r.imported} stories welcomed home.${r.skipped?` ${r.skipped} were already here.`:''}`);})}>Bring in my stories<Icon name="arrow"/></button>
 {:else if section==='storage'}
  <h3>Your library</h3><p class="hint">Sailune remembers your stories on this device. Choose another collection, or start somewhere new.</p><div class="file-location"><Icon name="book" size={30}/><span>{filename(draft.Data)||'Your collection'}</span></div>
  <div class="button-row"><button onclick={()=>run(()=>choose('database',p=>draft.Data=p))}>Choose a library</button><button onclick={()=>run(()=>choose('new-database',p=>draft.Data=p))}><Icon name="plus"/>Start a new library</button></div>
  <details class="disclosure"><summary>Choose exact locations<Icon name="plus"/></summary><label>Library file<input bind:value={draft.Data}/></label><label>Sign-in folder<div class="input-action"><input bind:value={draft.Sessions}/><button aria-label="Choose sign-in folder" onclick={()=>run(()=>choose('directory',p=>draft.Sessions=p))}><Icon name="folder"/></button></div></label><p class="hint">Keep these on this device. To move stories between devices, use a backup.</p></details>
  <details class="disclosure"><summary>Website compatibility<Icon name="plus"/></summary><label>Custom browser identifier<input bind:value={draft.UserAgent} placeholder="Use Sailune’s default"/></label><p class="hint">Some websites need a particular browser identifier. Leave this empty unless you need a custom one.</p></details>
  <button class="primary" onclick={()=>run(async()=>{await onchange({...draft});notify('Your library is ready.');})}>Use these preferences<Icon name="check"/></button><p class="hint">Location preferences apply until you close Sailune.</p>
 {/if}
 </fieldset>
</Sheet>
