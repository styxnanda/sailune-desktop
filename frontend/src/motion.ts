export const duration=(ms:number)=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms;
export function friendlyError(raw:string):string {
 if(/duplicate|already bookmarked/i.test(raw))return 'This story is already in your collection.';
 if(/canceled|cancelled/i.test(raw))return 'Stopped. Your saved stories are safe.';
 if(/challenge|denied access|rate limit|403/i.test(raw))return 'The story’s website isn’t letting us in right now. Try again later, or save it without filling in the details.';
 if(/login required|session expired/i.test(raw))return 'Please reconnect this website in Your space, then try again.';
 if(/unavailable|deleted/i.test(raw))return 'This story may no longer be available. You can still keep your own bookmark.';
 if(/already exists/i.test(raw))return 'There’s already a file with that name. Choose a new name to keep both copies.';
 if(/pristine|empty library/i.test(raw))return 'Choose an empty library to restore this backup, or add the stories to your current collection.';
 if(/caught up/i.test(raw))return 'You’re all caught up. Check for new chapters, or open the story to read it again.';
 if(/AO3 chapter index|chapter exceeds/i.test(raw))return 'We need the latest chapter details first. Choose “Check for updates”, then try again.';
 if(/browser|cookies|credential|keyring/i.test(raw))return 'We couldn’t connect this account. Make sure you’re signed in to the selected browser, or try a saved sign-in file.';
 if(/connection is unavailable/i.test(raw))return 'Your library isn’t connected. Please open the Sailune desktop app.';
 return 'That didn’t work this time. Your changes are still here, so you can try again.';
}
