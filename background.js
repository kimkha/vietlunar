importScripts("amlich.js");

var ALARM_NAME = "refreshLunarIcon";

function refreshText() {
	refreshTime();
	var current = getCurrentLunarToday();
	var title = getDayName(current);

	chrome.action.setIcon({path: "icon/" + current.day + ".png"});
	chrome.action.setTitle({title: title});
}

function ensureAlarm() {
	chrome.alarms.create(ALARM_NAME, {periodInMinutes: 60});
}

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name === ALARM_NAME) {
		refreshText();
	}
});

chrome.runtime.onInstalled.addListener(function() {
	ensureAlarm();
	refreshText();
});

chrome.runtime.onStartup.addListener(function() {
	refreshText();
});

ensureAlarm();
refreshText();
