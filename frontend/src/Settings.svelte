<script lang="ts">
 import {call,open,pick,confirmAction,type Config,type Session} from './api';
 export let config:Config;
 export let busy=false;
 export let run:(task:()=>Promise<void>)=>Promise<void>;
 export let notify:(message:string)=>void;
 export let onchange:(config:Config)=>Promise<void>;
 let draft={...config};
 let site='ao3', browser='chromium/chrome', profile='', consent=false;
 let session:Session|null=null;
 let transferPath='',merge=true;
 const payload=()=>({Config:config,Site:site});
 async function choose(kind:string,set:(s:string)=>void) {const p=await pick(kind);if(p)set(p);}
 async function auth(action:string,path='') {
  const result=await call<Session|null>(action,{...payload(),Path:path,Browser:browser+(profile?':'+profile:''),Consent:consent});
  session=result;notify(action==='session-status'?'Session status checked.':'Session updated.');
 }
</script>
<div class="settings">
 <p class="eyebrow">MAKE YOURSELF AT HOME</p><h1>Settings & transfers</h1><p class="muted">One library, shared with Sailune-Go. Your stories stay on your device.</p>
 <fieldset disabled={busy}>
 <section class="panel"><h2>Library location</h2><p class="hint">Defaults match the CLI, including SAILUNE_DATA, SAILUNE_SESSIONS and SAILUNE_USER_AGENT. Changes apply to this desktop session.</p>
 <label>SQLite library<div class="input-action"><input bind:value={draft.Data}/><button onclick={()=>run(()=>choose('database',p=>draft.Data=p))}>Browse</button></div></label>
 <label>Encrypted session directory<div class="input-action"><input bind:value={draft.Sessions}/><button onclick={()=>run(()=>choose('directory',p=>draft.Sessions=p))}>Browse</button></div></label>
 <label>Request User-Agent<input bind:value={draft.UserAgent} placeholder="Sailune default"/></label>
 <button class="primary" onclick={()=>run(async()=>{await onchange({...draft});notify('Library location applied.');})}>Apply locations</button></section>
 <section class="panel"><h2>Site sessions</h2><p class="hint">Log in in your browser, then import cookies when ready. Only cookies for the selected site are imported; Sailune-Go encrypts them using your OS credential store.</p>
 <div class="form-grid"><label>Site<select bind:value={site} onchange={()=>{session=null;consent=false;}}><option value="ao3">Archive of Our Own</option><option value="ffn">FanFiction.net</option></select></label><div class="button-row"><button onclick={()=>run(()=>open('login',payload()))}>Open login page ↗</button><button onclick={()=>run(()=>auth('session-status'))}>Check session</button></div></div>
 {#if session}<p class="session-status">{session.configured?'Saved session':'No saved session'} · {session.usable_cookies} usable cookies <span class="hint">(does not verify server login)</span></p>{/if}
 <div class="form-grid"><label>Browser<select bind:value={browser}><option value="chromium/chrome">Chromium · Chrome</option><option value="chromium/edge">Chromium · Edge</option><option value="chromium/brave">Chromium · Brave</option><option value="chromium/chromium">Chromium</option><option value="chromium/vivaldi">Chromium · Vivaldi</option><option value="chromium/opera">Chromium · Opera</option><option value="gecko/firefox">Gecko · Firefox</option></select></label><label>Profile name or absolute path (optional)<input bind:value={profile} placeholder="Default, Profile 1, or /path/to/profile"/></label></div>
 <label class="check consent"><input type="checkbox" bind:checked={consent}/>I authorize importing cookies for this site into Sailune’s encrypted session store.</label>
 <div class="button-row"><button disabled={!consent} onclick={()=>run(()=>auth('session-browser'))}>Import from browser</button><button disabled={!consent} onclick={()=>run(async()=>{const p=await pick('file');if(p)await auth('session-file',p);})}>Import cookies.txt</button><button class="danger" onclick={()=>run(async()=>{if(await confirmAction('Clear the saved Sailune session for '+site+'? Your browser login stays unchanged.')){await call('session-clear',{...payload(),Consent:true});session=null;notify('Saved session cleared.');}})}>Clear session</button></div>
 <details><summary>Migrate a legacy session</summary><p class="hint">Choose the directory containing the old site JSON. Successful migration encrypts it and removes the original plaintext session file.</p><button onclick={()=>run(async()=>{const p=await pick('directory');if(p&&await confirmAction('Encrypt the '+site+' session from '+p+' and remove its original plaintext file?')){await call('session-migrate',{...payload(),Path:p,Consent:true});notify('Legacy session migrated.');}})}>Choose legacy directory</button></details>
 <p class="hint">Browser challenges may still block fetching. Windows app-bound (v20) cookies, KWallet, Firefox containers and partitioned cookies are unsupported by the core. Use a supported profile or Netscape export.</p></section>
 <section class="panel"><h2>Portable snapshots</h2><p class="hint">Export a closed JSON snapshot for backup or transfer. Live SQLite databases must stay local. Snapshots contain bookmarks and personal notes, never browser sessions.</p>
 <button onclick={()=>run(async()=>{const p=await pick('export');if(p){await call('export',{Config:config,Path:p});notify('Snapshot exported to '+p);}})}>Export library…</button>
 <hr/><label>Import snapshot or legacy JSON<div class="input-action"><input bind:value={transferPath} placeholder="Choose a Sailune JSON file"/><button onclick={()=>run(()=>choose('file',p=>transferPath=p))}>Browse</button></div></label>
 <label class="check"><input type="checkbox" bind:checked={merge}/>Merge into this library and skip duplicate stories</label><p class="hint">With merge disabled, import requires a pristine destination and preserves IDs. The source file is always kept.</p>
 <button disabled={!transferPath} onclick={()=>run(async()=>{const r=await call<{imported:number;skipped:number}>('import',{Config:config,Path:transferPath,Merge:merge});notify(`Imported ${r.imported} bookmarks; skipped ${r.skipped} duplicates.`);})}>Import snapshot</button></section>
 <p class="hint">Sailune Desktop 0.1.0 · Wails, Svelte & TypeScript · Powered by Sailune-Go<br/>Windows & Linux MVP. macOS SwiftUI is a separate, future client.</p>
 </fieldset>
</div>
