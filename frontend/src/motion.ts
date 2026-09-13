export const duration=(ms:number)=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms;
export function friendlyError(raw:string):string {
 if(/duplicate|already bookmarked/i.test(raw))return 'This story is already in your collection.';
 if(/canceled|cancelled/i.test(raw))return 'Stopped. Your saved stories are safe.';
 if(/challenge|denied access|rate limit|403/i.test(raw))return 'The story’s website isn’t letting us in right now. Try again later, or save it without filling in the details.';
 if(/login required|session expired/i.test(raw))return 'Please reconnect this website in Settings, then try again.';
 if(/unavailable|deleted/i.test(raw))return 'This story may no longer be available. You can still keep your own bookmark.';
 if(/already exists/i.test(raw))return 'There’s already a file with that name. Choose a new name to keep both copies.';
 if(/pristine|empty library/i.test(raw))return 'Choose an empty library to restore this backup, or add the stories to your current collection.';
 if(/caught up/i.test(raw))return 'You’re all caught up. Check for new chapters, or open the story to read it again.';
 if(/AO3 chapter index|chapter exceeds/i.test(raw))return 'We need the latest chapter details first. Choose “Refresh details”, then try again.';
 if(/browser|cookies|credential|keyring/i.test(raw))return 'We couldn’t connect this account. Make sure you’re signed in to the selected browser, or try a saved sign-in file.';
 if(/connection is unavailable/i.test(raw))return 'Your library isn’t connected. Please open the Sailune desktop app.';
 return 'Something went wrong. Try again.';
}

// Delegation also covers controls rendered in native dialogs.
export function interactions(node: HTMLElement) {
 const bounce=(event: MouseEvent)=>{
  if(!duration(1)||!(event.target instanceof Element))return;
  const target=event.target.closest<HTMLElement>('button, summary');
  if(!target||target.matches(':disabled')||!node.contains(target))return;
  target.getAnimations().filter(a=>a.id==='press-feedback').forEach(a=>a.cancel());
  const animation=target.animate([
   {scale:'.96',offset:0},{scale:'1.025',offset:.48},{scale:'.995',offset:.78},{scale:'1',offset:1}
  ],{duration:320,easing:'ease-out'});
  animation.id='press-feedback';
 };
 node.addEventListener('click',bounce);
 return {destroy(){node.removeEventListener('click',bounce);}};
}
