
function refreshText() {
	refreshTime();
	var current = getCurrentLunarToday();
	var text = "" + current.day;
	var title = "";
	
	chrome.browserAction.setBadgeBackgroundColor({color:"#008"});
	chrome.browserAction.setBadgeText({text:text});
}

refreshText();
setTimeout(refreshText, 60*60*1000);
