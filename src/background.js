importScripts("amlich.js");

const ALARM_NAME = "refreshLunarIcon";

function refreshText() {
	refreshTime();
	const current = getCurrentLunarToday();
	const title = getDayName(current);

	chrome.action.setIcon({path: `icon/${current.day}.png`});
	chrome.action.setTitle({title});
}

function ensureAlarm() {
	chrome.alarms.create(ALARM_NAME, {periodInMinutes: 60});
}

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === ALARM_NAME) {
		refreshText();
	}
});

chrome.runtime.onInstalled.addListener(() => {
	ensureAlarm();
	refreshText();
});

chrome.runtime.onStartup.addListener(() => {
	refreshText();
});

ensureAlarm();
refreshText();
