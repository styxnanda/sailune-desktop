export type Config = {Data:string; Sessions:string; UserAgent:string};
export type Metadata = {title:string; authors:string[]; summary:string; fandoms:string[]; tags:string[]; language:string; rating:string; words:number; chapters:number; total_chapters:number; complete:boolean; published:string; updated:string; fetched_at:string};
export type Bookmark = {id:number; url:string; site:string; title:string; author:string; status:string; chapter:number; tags:string[]; notes:string; rating:number; review_notes:string; created_at:string; updated_at:string; last_read_at:string; metadata?:Metadata; overrides?:Partial<Metadata>; effective:Metadata; progress:{known:boolean; read:number; published:number; unread:number; percent:number}};
export type Session = {site:string; configured:boolean; usable_cookies:number};
export type Filter = {Collection?:string; Rules?:Rules;Query:string; Site:string; Status:string; Tag:string; Author:string; Fandom:string; Language:string; SourceTag:string; Complete:boolean|null; Unread:boolean; MinRating:number; MinWords:number; MaxWords:number; Sort:string; Desc:boolean; Limit:number; Offset:number};
export const defaultFilter = ():Filter => ({Query:'',Site:'',Status:'',Tag:'',Author:'',Fandom:'',Language:'',SourceTag:'',Complete:null,Unread:false,MinRating:0,MinWords:0,MaxWords:0,Sort:'added',Desc:true,Limit:50,Offset:0});
export const statuses = ['planned','reading','completed','hold','dropped'];
export const statusLabel = (s:string) => ({planned:'To read',reading:'Reading',completed:'Completed',hold:'On hold',dropped:'Dropped'}[s] || s);
declare global { interface Window { go?:{main:{App:{ArtworkInfo:(data:string,id:number)=>Promise<string>; ArtworkData:(data:string,asset:string,small:boolean)=>Promise<string>; PreviewArtwork:(path:string,role:string,x:number,y:number)=>Promise<string>; Call:(a:string,p:string)=>Promise<string>; Open:(a:string,p:string)=>Promise<void>; Pick:(k:string)=>Promise<string>; Copy:(action:string,payload:string)=>Promise<void>; Confirm:(message:string)=>Promise<boolean>; Cancel:()=>Promise<void>}}} } }
function bridge() { const app=window.go?.main.App; if(!app) throw new Error('The desktop connection is unavailable. Launch Sailune with Wails to access your library.'); return app; }
export async function call<T>(action:string, payload:unknown={}):Promise<T> { return JSON.parse(await bridge().Call(action,JSON.stringify(payload))); }
export async function open(action:string,payload:unknown) { await bridge().Open(action,JSON.stringify(payload)); }
export const pick=(kind:string)=>bridge().Pick(kind);
export const cancel=()=>bridge().Cancel();
export function patchBetween(before:Bookmark, after:Bookmark):Record<string,unknown> {
 const fields:Record<string,string>={title:'Title',author:'Author',status:'Status',chapter:'Chapter',tags:'Tags',notes:'Notes',rating:'Rating',review_notes:'ReviewNotes',created_at:'CreatedAt',last_read_at:'LastReadAt'};
 const patch:Record<string,unknown>={};
 for(const [field,key] of Object.entries(fields)) if(JSON.stringify(before[field as keyof Bookmark])!==JSON.stringify(after[field as keyof Bookmark])) patch[key]=after[field as keyof Bookmark];
 return patch;
}

export const confirmAction=(message:string)=>bridge().Confirm(message);
export const copy=(action:string,payload:unknown)=>bridge().Copy(action,JSON.stringify(payload));

export type TagRule={tags:string[];all:boolean};
export type Rules={personal:TagRule;source:TagRule;site:string;status:string;fandom:string};
export type Collection={id:string;name:string;kind:'manual'|'smart';rules:Rules;count:number};
export type Art={story_id:number;role:'cover'|'background';asset_id:string;x:number;y:number;width:number;height:number};
export const emptyRules=():Rules=>({personal:{tags:[],all:false},source:{tags:[],all:false},site:'',status:'',fandom:''});
export const feature=<T>(config:Config,request:Record<string,unknown>)=>call<T>('organize',{Config:config,Feature:request});
export const artworkInfo=(config:Config,id:number):Promise<Art[]>=>bridge().ArtworkInfo(config.Data,id).then(JSON.parse);
const assetCache=new Map<string,Promise<string>>();
export function artworkURL(config:Config,id:string,small=true):Promise<string>{const key=`${config.Data}:${id}:${small}`;let p=assetCache.get(key);if(!p){p=bridge().ArtworkData(config.Data,id,small);assetCache.set(key,p);p.catch(()=>assetCache.delete(key));if(assetCache.size>160)assetCache.delete(assetCache.keys().next().value!);}return p;}
export const previewArtwork=(path:string,role:string,x:number,y:number)=>bridge().PreviewArtwork(path,role,x,y);
