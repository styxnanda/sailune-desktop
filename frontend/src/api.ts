export type Config = {Data:string; Sessions:string; UserAgent:string};
export type Metadata = {title:string; authors:string[]; summary:string; fandoms:string[]; tags:string[]; language:string; rating:string; words:number; chapters:number; total_chapters:number; complete:boolean; published:string; updated:string; fetched_at:string};
export type Bookmark = {id:number; url:string; site:string; title:string; author:string; status:string; chapter:number; tags:string[]; notes:string; rating:number; review_notes:string; created_at:string; updated_at:string; last_read_at:string; metadata?:Metadata; overrides?:Partial<Metadata>; effective:Metadata; progress:{known:boolean; read:number; published:number; unread:number; percent:number}};
export type Session = {site:string; configured:boolean; usable_cookies:number};
export type Filter = {Query:string; Site:string; Status:string; Tag:string; Author:string; Fandom:string; Language:string; SourceTag:string; Complete:boolean|null; Unread:boolean; MinRating:number; MinWords:number; MaxWords:number; Sort:string; Desc:boolean; Limit:number; Offset:number};
export const defaultFilter = ():Filter => ({Query:'',Site:'',Status:'',Tag:'',Author:'',Fandom:'',Language:'',SourceTag:'',Complete:null,Unread:false,MinRating:0,MinWords:0,MaxWords:0,Sort:'added',Desc:true,Limit:50,Offset:0});
export const statuses = ['planned','reading','completed','hold','dropped'];
export const statusLabel = (s:string) => ({planned:'To read',reading:'Reading',completed:'Completed',hold:'On hold',dropped:'Dropped'}[s] || s);
declare global { interface Window { go?:{main:{App:{Call:(a:string,p:string)=>Promise<string>; Open:(a:string,p:string)=>Promise<void>; Pick:(k:string)=>Promise<string>; Confirm:(message:string)=>Promise<boolean>; Cancel:()=>Promise<void>}}} } }
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
