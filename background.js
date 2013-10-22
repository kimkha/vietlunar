
function refreshText() {
	refreshTime();
	var current = getCurrentLunarToday();
	var text = "" + current.day;
	var title = getDayName(current);
	
	chrome.browserAction.setIcon({path:"icon/"+current.day+".png"});
	chrome.browserAction.setTitle({title:title});
	//chrome.browserAction.setBadgeBackgroundColor({color:"#008"});
	//chrome.browserAction.setBadgeText({text:text});
	setTimeout(refreshText, 60*60*1000);
}

refreshText();
