"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const PROJECT_ROOT = path.join(__dirname, "..");

class ClassList {
	constructor(node) {
		this.node = node;
	}
	get names() {
		return (this.node.className || "").split(" ").filter(Boolean);
	}
	add(name) {
		const names = this.names;
		if (!names.includes(name)) {
			names.push(name);
		}
		this.node.className = names.join(" ");
	}
	remove(name) {
		this.node.className = this.names.filter((n) => n !== name).join(" ");
	}
	contains(name) {
		return this.names.includes(name);
	}
}

class StubNode {
	constructor(tag) {
		this.tagName = (tag || "").toUpperCase();
		this.children = [];
		this.className = "";
		this.dataset = {};
		this.parentNode = null;
		this.title = "";
		this.type = "";
		this.disabled = false;
		this.colSpan = 0;
		this.classList = new ClassList(this);
		this.listeners = {};
		this.ownText = "";
	}

	get isFragment() {
		return this.tagName === "";
	}

	get textContent() {
		return this.children.length > 0
			? this.children.map((child) => child.textContent).join("")
			: this.ownText;
	}

	set textContent(value) {
		this.ownText = String(value);
		this.children = [];
	}

	append(...nodes) {
		for (const node of nodes) {
			if (node.isFragment) {
				for (const child of node.children) {
					child.parentNode = this;
					this.children.push(child);
				}
				node.children = [];
			} else {
				node.parentNode = this;
				this.children.push(node);
			}
		}
	}

	replaceChildren(...nodes) {
		this.children = [];
		this.ownText = "";
		this.append(...nodes);
	}

	addEventListener(type, handler) {
		this.listeners[type] = handler;
	}

	dispatch(type, target) {
		const handler = this.listeners[type];
		if (!handler) {
			throw new Error("stub: no listener for " + type);
		}
		handler({ target: target, currentTarget: this });
	}

	querySelector(selector) {
		return getDescendants(this).find((node) => matchesSelector(node, selector)) || null;
	}

	querySelectorAll(selector) {
		return getDescendants(this).filter((node) => matchesSelector(node, selector));
	}
}

function getDescendants(root) {
	const found = [];
	const walk = (node) => {
		for (const child of node.children) {
			found.push(child);
			walk(child);
		}
	};
	walk(root);
	return found;
}

function matchesSelector(node, selector) {
	const attribute = /^([a-z]+)?\[data-([a-zA-Z]+)="([^"]*)"\]$/.exec(selector);
	if (attribute) {
		const tagMatches = !attribute[1] || node.tagName === attribute[1].toUpperCase();
		return tagMatches && String(node.dataset[attribute[2]]) === attribute[3];
	}
	const className = /^\.([\w-]+)$/.exec(selector);
	if (className) {
		return node.classList.contains(className[1]);
	}
	const tag = /^([a-z]+)$/.exec(selector);
	if (tag) {
		return node.tagName === tag[1].toUpperCase();
	}
	throw new Error("stub: unsupported selector " + selector);
}

function serialize(node) {
	if (node.isFragment) {
		return node.children.map(serialize).join("");
	}
	const tag = node.tagName.toLowerCase();
	const attributes = [];
	if (node.className) {
		attributes.push(`class="${node.className}"`);
	}
	for (const [key, value] of Object.entries(node.dataset)) {
		attributes.push(`data-${key}="${value}"`);
	}
	if (node.title) {
		attributes.push(`title="${node.title}"`);
	}
	if (node.colSpan) {
		attributes.push(`colspan="${node.colSpan}"`);
	}
	if (node.disabled) {
		attributes.push("disabled");
	}
	const open = attributes.length > 0 ? `<${tag} ${attributes.join(" ")}>` : `<${tag}>`;
	const inner = node.children.length > 0 ? node.children.map(serialize).join("") : node.ownText;
	return `${open}${inner}</${tag}>`;
}

function createFrozenDate(year, monthIndex, day) {
	const frozen = new Date(year, monthIndex, day, 12, 0, 0);
	return class FrozenDate extends Date {
		constructor(...args) {
			if (args.length === 0) {
				super(frozen.getTime());
			} else {
				super(...args);
			}
		}
		static now() {
			return frozen.getTime();
		}
	};
}

function createPopupEnv(options) {
	const today = (options && options.today) || [2026, 8, 1];
	const scripts = (options && options.scripts) || { amlich: "amlich.js", popup: "popup.js" };

	const context = vm.createContext({
		console,
		Date: createFrozenDate(today[0], today[1], today[2]),
		Math,
		JSON,
		WeakMap,
		Map,
		Set,
		Array,
		Object,
		String,
		Number,
		RegExp,
		parseInt,
		parseFloat,
		isNaN,
	});

	const run = (file) => {
		const full = path.isAbsolute(file) ? file : path.join(PROJECT_ROOT, file);
		vm.runInContext(fs.readFileSync(full, "utf8"), context, { filename: file });
	};

	run(scripts.amlich);

	const content = new StubNode("div");
	const dayinfo = new StubNode("div");
	const alerts = [];
	const openedWindows = [];
	let printCalls = 0;

	context.document = {
		createElement: (tag) => new StubNode(tag),
		createDocumentFragment: () => new StubNode(""),
		getElementById: (id) => (id === "content" ? content : id === "dayinfo" ? dayinfo : null),
		querySelector: (selector) => content.querySelector(selector),
	};
	context.window = {
		document: context.document,
		alert: (message) => alerts.push(message),
		open: (url) => openedWindows.push(url),
		print: () => { printCalls += 1; },
	};
	context.alert = context.window.alert;

	run(scripts.popup);
	context.window.onload();

	const getDayCells = () => content.querySelectorAll('td[data-action="day-info"]');
	const getButton = (action) => content.querySelectorAll("button").find((b) => b.dataset.action === action);

	return {
		content,
		dayinfo,
		alerts,
		openedWindows,
		getPrintCalls: () => printCalls,

		getMonthTitle: () => content.querySelector(".tenthang").textContent,
		getDayCells,
		getButtons: () => content.querySelectorAll("button"),
		getButton,
		getSolarText: (cell) => cell.children[0].textContent,
		getLunarText: (cell) => cell.children[1].textContent,
		getSelectedCells: () => content.querySelectorAll(".chon"),
		getInfoText: (className) => {
			const node = dayinfo.querySelector("." + className);
			return node ? node.textContent : null;
		},
		getInfoValues: () => dayinfo.querySelectorAll("dd").map((dd) => dd.textContent),
		getInfoLabels: () => dayinfo.querySelectorAll("dt").map((dt) => dt.textContent),
		getGioChips: () => dayinfo.querySelectorAll(".gio").map((span) => span.textContent),

		clickAction: (action) => {
			const button = getButton(action);
			if (!button) {
				throw new Error("no button for action " + action);
			}
			if (button.disabled) {
				return false;
			}
			content.dispatch("click", button);
			return true;
		},
		clickNode: (node) => content.dispatch("click", node),
		clickDay: (solarDay) => {
			const cell = getDayCells().find((c) => c.children[0].textContent === String(solarDay));
			if (!cell) {
				throw new Error("no cell for solar day " + solarDay);
			}
			content.dispatch("click", cell);
			return cell;
		},
		goToMonth: (mm, yy) => {
			for (let guard = 0; guard < 6000; guard++) {
				const [currentMonth, currentYear] = content.querySelector(".tenthang").textContent.split("/").map(Number);
				if (currentMonth === mm && currentYear === yy) {
					return true;
				}
				const yearStep = currentYear < yy ? "next-year" : currentYear > yy ? "prev-year" : null;
				const action = yearStep || (currentMonth < mm ? "next-month" : "prev-month");
				const button = getButton(action);
				if (!button || button.disabled) {
					return false;
				}
				content.dispatch("click", button);
			}
			return false;
		},

		serializeContent: () => serialize(content),
		serializeInfo: () => serialize(dayinfo),
	};
}

module.exports = { createPopupEnv, serialize, StubNode, PROJECT_ROOT };
