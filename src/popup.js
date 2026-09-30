(function(window) {

	const ABOUT = "Âm lịch Việt Nam - Version 0.8\n© 2004 Hồ Ngọc Đức [http://come.to/duc]";
	const DAYNAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
	const DAYNAMES_FULL = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
	const MIN_YEAR = 1800;
	const MAX_YEAR = 2199;
	const UPCOMING_MONTHS = 12;
	const WEEKS_PER_MONTH = 5;
	const SLOTS_PER_MONTH = 7 * WEEKS_PER_MONTH;
	const YEARS_PER_PAGE = 9;
	const YEAR_PAGE_HALF = (YEARS_PER_PAGE - 1) / 2;
	const PERSONAL_NAME_MAX = 40;
	const COUNTDOWN_MAX_DAYS = 99;

	const LUNAR_HOLIDAYS = {
		"1/1": "Tết Nguyên Đán",
		"2/1": "Tết Nguyên Đán (mùng 2)",
		"3/1": "Tết Nguyên Đán (mùng 3)",
		"15/1": "Tết Nguyên Tiêu",
		"3/3": "Tết Hàn Thực",
		"10/3": "Giỗ Tổ Hùng Vương",
		"15/4": "Lễ Phật Đản",
		"5/5": "Tết Đoan Ngọ",
		"15/7": "Lễ Vu Lan báo hiếu",
		"15/8": "Tết Trung Thu",
		"23/12": "Ông Táo về trời"
	};

	const SOLAR_HOLIDAYS = {
		"1/1": "Tết Dương lịch",
		"14/2": "Lễ Tình nhân",
		"8/3": "Quốc tế Phụ nữ",
		"30/4": "Giải phóng miền Nam",
		"1/5": "Quốc tế Lao động",
		"1/6": "Quốc tế Thiếu nhi",
		"2/9": "Quốc khánh",
		"20/10": "Ngày Phụ nữ Việt Nam",
		"20/11": "Ngày Nhà giáo Việt Nam",
		"22/12": "Ngày Quân đội nhân dân",
		"25/12": "Lễ Giáng sinh"
	};

	// Mùng 2 và 3 gộp vào dòng Tết Nguyên Đán của mùng 1 trong box "sắp tới"
	const TET_CONTINUATION = { "2/1": true, "3/1": true };

	// Chốt danh sách cho box "sắp tới": thêm khoá vào LUNAR_HOLIDAYS không tự vào box
	// "bold" = lễ âm được nghỉ chính thức
	const UPCOMING_LUNAR_HOLIDAYS = {
		"1/1": "bold",
		"2/1": "bold",
		"3/1": "bold",
		"15/1": "normal",
		"10/3": "bold",
		"5/5": "normal",
		"15/7": "normal",
		"15/8": "normal",
		"23/12": "normal"
	};

	const dayByCell = new WeakMap();
	const holidayByRow = new WeakMap();
	let selectedCell = null;
	let selectedJd = null;
	let viewMonth = 0;
	let viewYear = 0;
	let pickerKind = null;
	let yearPageBase = 0;
	let personalDays = [];

	function createEl(tag, className, text) {
		const node = document.createElement(tag);
		if (className) {
			node.className = className;
		}
		if (text !== undefined) {
			node.textContent = String(text);
		}
		return node;
	}

	function createNavButton(action, label, hint, disabled) {
		const button = createEl("button", null, label);
		button.type = "button";
		button.title = hint;
		button.disabled = disabled;
		button.dataset.action = action;
		return button;
	}

	function createTitleCell(mm, yy) {
		const month = createEl("span", "tenthang-thang", `Tháng ${mm}`);
		month.title = "Chọn tháng";
		month.dataset.action = "open-month-picker";

		const year = createEl("span", "tenthang-nam", yy);
		year.title = "Chọn năm";
		year.dataset.action = "open-year-picker";

		const title = createEl("td", "tenthang");
		title.colSpan = 3;
		title.append(month, year);
		return title;
	}

	function createNavRow(mm, yy) {
		const row = document.createElement("tr");

		const left = createEl("td", "navi-l");
		left.colSpan = 2;
		left.append(
			createNavButton("prev-year", "<<", "Năm trước", yy - 1 < MIN_YEAR),
			createNavButton("prev-month", "<", "Tháng trước", mm === 1 && yy - 1 < MIN_YEAR)
		);

		const right = createEl("td", "navi-r");
		right.colSpan = 2;
		right.append(
			createNavButton("next-month", ">", "Tháng sau", mm === 12 && yy + 1 > MAX_YEAR),
			createNavButton("next-year", ">>", "Năm sau", yy + 1 > MAX_YEAR)
		);

		row.append(left, createTitleCell(mm, yy), right);
		return row;
	}

	function createWeekdayRow() {
		const row = document.createElement("tr");
		row.dataset.action = "about";
		for (const name of DAYNAMES) {
			row.append(createEl("td", "ngaytuan", name));
		}
		return row;
	}

	function createDayCell(lunar, sday, smonth, syear) {
		const today = getToday();
		const isToday = sday === today.getDate()
			&& smonth === today.getMonth() + 1
			&& syear === today.getFullYear();
		const isHoliday = getHolidayNames(lunar, sday, smonth).length > 0;

		const cell = createEl("td", isHoliday ? "tet" : (isToday ? "homnay" : "ngaythang"));
		cell.title = getDayName(lunar);
		cell.dataset.action = "day-info";
		cell.dataset.jd = lunar.jd;
		dayByCell.set(cell, { lunar, sday, smonth, syear });

		const dow = (lunar.jd + 1) % 7;
		const solarClass = dow === 0 ? "cn" : (dow === 6 ? "t7" : "t2t6");
		const lunarLabel = (sday === 1 || lunar.day === 1)
			? `${lunar.day}/${lunar.month}`
			: lunar.day;
		cell.append(
			createEl("div", solarClass, sday),
			createEl("div", lunar.leap === 1 ? "am2" : "am", lunarLabel)
		);
		return cell;
	}

	// Lịch cố định 5 hàng: tuần thứ 6 gối lên ô đệm đầu tháng, cùng cột thứ trong tuần.
	// Luôn vừa vì tháng dài nhất 31 ngày < 35 ô, nên số ngày tràn <= số ô đệm đầu.
	function createMonthTable(mm, yy) {
		const days = getMonth(mm, yy);
		if (days.length === 0) {
			return null;
		}
		const leadingBlanks = (days[0].jd + 1) % 7;
		const body = document.createElement("tbody");
		body.append(createNavRow(mm, yy), createWeekdayRow());

		for (let week = 0; week < WEEKS_PER_MONTH; week++) {
			const row = document.createElement("tr");
			for (let slot = 0; slot < 7; slot++) {
				let index = 7 * week + slot - leadingBlanks;
				if (index < 0) {
					index += SLOTS_PER_MONTH;
				}
				if (index >= days.length) {
					row.append(createEl("td", "ngaythang"));
				} else {
					row.append(createDayCell(days[index], index + 1, mm, yy));
				}
			}
			body.append(row);
		}

		const table = createEl("table", "thang");
		table.append(body);
		return table;
	}

	function createYearTable(yy) {
		const body = document.createElement("tbody");

		const title = createEl("td", "tennam", `Năm ${getYearCanChi(yy)} ${yy}`);
		title.colSpan = 3;
		title.dataset.action = "open-year-picker";
		const titleRow = document.createElement("tr");
		titleRow.append(title);
		body.append(titleRow);

		let row = null;
		for (let mm = 1; mm <= 12; mm++) {
			if (mm % 3 === 1) {
				row = document.createElement("tr");
			}
			const cell = document.createElement("td");
			const month = createMonthTable(mm, yy);
			if (month) {
				cell.append(month);
			}
			row.append(cell);
			if (mm % 3 === 0) {
				body.append(row);
			}
		}

		const table = createEl("table", "nam");
		table.append(body);
		return table;
	}

	function createGioHoangDao(jd) {
		const cell = createEl("dd", "tin-gio");
		for (const part of getGioHoangDao(jd).split(",")) {
			const gio = part.replace(/\s+/g, " ").trim();
			if (gio.length > 0) {
				cell.append(createEl("span", "gio", gio));
			}
		}
		return cell;
	}

	function formatCanChi(lunar) {
		const cc = getCanChi(lunar);
		return `Ngày ${cc[0]}, tháng ${cc[1]}, năm ${cc[2]}`;
	}

	function getHolidayNames(lunar, sday, smonth) {
		const names = [];
		if (lunar.leap !== 1) {
			const lunarName = LUNAR_HOLIDAYS[`${lunar.day}/${lunar.month}`];
			if (lunarName) {
				names.push(lunarName);
			}
		}
		const solarName = SOLAR_HOLIDAYS[`${sday}/${smonth}`];
		if (solarName) {
			names.push(solarName);
		}
		return names;
	}

	function createDayInfo(lunar, sday, smonth, syear) {
		const dow = (lunar.jd + 1) % 7;
		const isLeap = lunar.leap === 1;

		const solarClass = `tin-duong${dow === 0 ? " tin-cn" : (dow === 6 ? " tin-t7" : "")}`;
		const lunarText = `Ngày ${lunar.day} tháng ${lunar.month}${isLeap ? " nhuận" : ""} ÂL`;
		const dates = createEl("div", "tin-ngay");
		dates.append(
			createEl("div", solarClass, `${DAYNAMES_FULL[dow]}, ${sday}/${smonth}/${syear}`),
			createEl("div", isLeap ? "tin-am tin-nhuan" : "tin-am", lunarText)
		);

		const head = createEl("div", "tin-dau");
		head.append(dates);

		const holidays = getHolidayNames(lunar, sday, smonth);
		if (holidays.length > 0) {
			head.append(createEl("div", "tin-le", holidays.join(" · ")));
		}

		const list = createEl("dl", "tin-bang");
		list.append(
			createEl("dt", null, "Can chi"),
			createEl("dd", null, formatCanChi(lunar)),
			createEl("dt", null, "Giờ đầu"),
			createEl("dd", null, `${getCanHour0(lunar.jd)} ${CHI[0]}`),
			createEl("dt", null, "Tiết"),
			createEl("dd", null, TIETKHI[getSunLongitude(lunar.jd + 1, 7.0)]),
			createEl("dt", null, "Giờ hoàng đạo"),
			createGioHoangDao(lunar.jd)
		);

		const info = document.createDocumentFragment();
		info.append(head, list);
		return info;
	}

	function showDayInfo(lunar, sday, smonth, syear) {
		document.getElementById("dayinfo").replaceChildren(createDayInfo(lunar, sday, smonth, syear));
		selectedJd = lunar.jd;
	}

	function selectCell(cell) {
		if (selectedCell) {
			selectedCell.classList.remove("chon");
		}
		if (cell) {
			cell.classList.add("chon");
		}
		selectedCell = cell;
	}

	function showDayInfoForCell(cell) {
		const day = dayByCell.get(cell);
		if (!day) {
			return;
		}
		showDayInfo(day.lunar, day.sday, day.smonth, day.syear);
		selectCell(cell);
	}

	function showTodayInfo() {
		const today = getToday();
		showDayInfo(getCurrentLunarToday(), today.getDate(), today.getMonth() + 1, today.getFullYear());
	}

	function collectUpcomingLunarHolidays(monthCount) {
		const today = getToday();
		const todayJd = getCurrentLunarToday().jd;
		const items = [];

		for (let k = 0; k < monthCount; k++) {
			const offset = today.getMonth() + k;
			const mm = (offset % 12) + 1;
			const yy = today.getFullYear() + Math.floor(offset / 12);
			if (yy > MAX_YEAR) {
				break;
			}
			const days = getMonth(mm, yy);
			for (const [i, lunar] of days.entries()) {
				if (lunar.jd < todayJd || lunar.leap === 1) {
					continue;
				}
				let key = `${lunar.day}/${lunar.month}`;
				let name = LUNAR_HOLIDAYS[key];
				if (!name || !UPCOMING_LUNAR_HOLIDAYS[key]) {
					continue;
				}

				const last = items.at(-1);
				if (TET_CONTINUATION[key]) {
					if (last && last.endJd === lunar.jd - 1 && last.name === LUNAR_HOLIDAYS["1/1"]) {
						last.endJd = lunar.jd;
						last.endDay = i + 1;
						last.endMonth = mm;
						last.endYear = yy;
						last.endLunarDay = lunar.day;
						continue;
					}
					// Mùng 1 đã qua: mùng 2/3 phải mang nhãn Tết, không phải nhãn "(mùng 2)"
					key = "1/1";
					name = LUNAR_HOLIDAYS[key];
				}

				items.push({
					jd: lunar.jd,
					endJd: lunar.jd,
					lunar,
					lunarDay: lunar.day,
					lunarMonth: lunar.month,
					endLunarDay: lunar.day,
					sday: i + 1,
					smonth: mm,
					syear: yy,
					endDay: i + 1,
					endMonth: mm,
					endYear: yy,
					name,
					isMajor: UPCOMING_LUNAR_HOLIDAYS[key] === "bold"
				});
			}
		}
		return items;
	}

	function formatHolidaySolar(item) {
		if (item.endJd === item.jd) {
			return `${item.sday}/${item.smonth}/${item.syear}`;
		}
		if (item.smonth === item.endMonth && item.syear === item.endYear) {
			return `${item.sday}–${item.endDay}/${item.smonth}/${item.syear}`;
		}
		return `${item.sday}/${item.smonth}–${item.endDay}/${item.endMonth}/${item.endYear}`;
	}

	function formatHolidayLunar(item) {
		const day = item.endLunarDay === item.lunarDay
			? item.lunarDay
			: `${item.lunarDay}–${item.endLunarDay}`;
		return `${day}/${item.lunarMonth} ÂL`;
	}

	function formatCountdown(days) {
		if (days <= 0) {
			return "hôm nay";
		}
		if (days === 1) {
			return "mai";
		}
		return `còn ${days} ngày`;
	}

	function appendCountdown(row, item, isNext) {
		const days = item.jd - getCurrentLunarToday().jd;
		if (isNext && days <= COUNTDOWN_MAX_DAYS) {
			row.append(createEl("span", "le-con", formatCountdown(days)));
		}
	}

	function createHolidayRow(item, isNext) {
		const row = createEl("li", "le-dong");
		row.dataset.action = "holiday-jump";
		row.title = `Xem ngày ${formatHolidaySolar(item)}`;
		holidayByRow.set(row, item);
		row.append(
			createEl("span", "le-duong", `${DAYNAMES[(item.jd + 1) % 7]} ${formatHolidaySolar(item)}`),
			createEl("span", "le-am", formatHolidayLunar(item)),
			createEl("span", item.isMajor ? "le-ten le-chinh" : "le-ten", item.name)
		);
		appendCountdown(row, item, isNext);
		return row;
	}

	function createHolidayList() {
		const items = collectUpcomingLunarHolidays(UPCOMING_MONTHS);
		if (items.length === 0) {
			return null;
		}
		const list = createEl("ul", "le-ds");
		for (const [i, item] of items.entries()) {
			list.append(createHolidayRow(item, i === 0));
		}

		const box = document.createDocumentFragment();
		box.append(createEl("div", "le-dau", "Ngày lễ âm lịch sắp tới"), list);
		return box;
	}

	function showUpcomingHolidays() {
		const box = createHolidayList();
		if (box) {
			document.getElementById("holidays").replaceChildren(box);
		}
	}

	function jumpToHoliday(row) {
		const item = holidayByRow.get(row);
		if (!item) {
			return;
		}
		// showDayInfo đặt selectedJd trước, để showMonth chọn đúng ô
		showDayInfo(item.lunar, item.sday, item.smonth, item.syear);
		showMonth(item.smonth, item.syear);
	}

	function createPersonalId() {
		return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
	}

	function sanitizePersonalDays(raw) {
		if (!Array.isArray(raw)) {
			return [];
		}
		const seen = new Set();
		const entries = [];
		for (const item of raw) {
			if (!item || typeof item !== "object") {
				continue;
			}
			const id = String(item.id || "");
			const name = String(item.name || "").trim();
			const lunarDay = Number(item.lunarDay);
			const lunarMonth = Number(item.lunarMonth);
			if (!id || seen.has(id) || !name || name.length > PERSONAL_NAME_MAX) {
				continue;
			}
			if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) {
				continue;
			}
			if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
				continue;
			}
			seen.add(id);
			entries.push({ id, name, lunarDay, lunarMonth });
		}
		return entries;
	}

	function readLocalPersonalDays(fallback) {
		try {
			const raw = localStorage.getItem("vietlunar.personalDays");
			if (raw == null) {
				return fallback;
			}
			return JSON.parse(raw);
		} catch (error) {
			return fallback;
		}
	}

	function getSyncStorage() {
		if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
			return chrome.storage.sync;
		}
		if (typeof localStorage !== "undefined") {
			return {
				get(defaults, done) {
					done({ personalDays: readLocalPersonalDays(defaults.personalDays) });
				},
				set(items, done) {
					localStorage.setItem("vietlunar.personalDays", JSON.stringify(items.personalDays));
					if (done) {
						done();
					}
				}
			};
		}
		return null;
	}

	function loadPersonalDays(done) {
		const api = getSyncStorage();
		if (!api) {
			done([]);
			return;
		}
		api.get({ personalDays: [] }, (result) => {
			done(sanitizePersonalDays(result && result.personalDays));
		});
	}

	function savePersonalDays(entries, done) {
		personalDays = entries;
		const api = getSyncStorage();
		if (!api) {
			if (done) {
				done();
			}
			return;
		}
		api.set({ personalDays: entries }, done);
	}

	function collectUpcomingPersonalDays(entries, monthCount) {
		if (entries.length === 0) {
			return [];
		}
		const byDate = new Map();
		for (const entry of entries) {
			const key = `${entry.lunarDay}/${entry.lunarMonth}`;
			const group = byDate.get(key);
			if (group) {
				group.push(entry);
			} else {
				byDate.set(key, [entry]);
			}
		}

		const today = getToday();
		const todayJd = getCurrentLunarToday().jd;
		const items = [];
		for (let k = 0; k < monthCount; k++) {
			const offset = today.getMonth() + k;
			const mm = (offset % 12) + 1;
			const yy = today.getFullYear() + Math.floor(offset / 12);
			if (yy > MAX_YEAR) {
				break;
			}
			const days = getMonth(mm, yy);
			for (const [i, lunar] of days.entries()) {
				if (lunar.jd < todayJd || lunar.leap === 1) {
					continue;
				}
				const key = `${lunar.day}/${lunar.month}`;
				const matches = byDate.get(key);
				if (!matches) {
					continue;
				}
				for (const entry of matches) {
					items.push({
						id: entry.id,
						jd: lunar.jd,
						endJd: lunar.jd,
						lunar,
						lunarDay: lunar.day,
						lunarMonth: lunar.month,
						endLunarDay: lunar.day,
						sday: i + 1,
						smonth: mm,
						syear: yy,
						endDay: i + 1,
						endMonth: mm,
						endYear: yy,
						name: entry.name
					});
				}
				byDate.delete(key);
			}
		}
		return items;
	}

	function createPersonalRow(item, isNext) {
		const row = createEl("li", "le-dong");
		row.dataset.action = "nho-jump";
		row.title = `Xem ngày ${formatHolidaySolar(item)}`;
		holidayByRow.set(row, item);
		const remove = createEl("button", "nho-xoa", "×");
		remove.type = "button";
		remove.title = "Xóa";
		remove.dataset.action = "nho-xoa";
		remove.dataset.id = item.id;
		const name = createEl("span", "le-ten", item.name);
		name.title = item.name;
		row.append(
			createEl("span", "le-duong", `${DAYNAMES[(item.jd + 1) % 7]} ${formatHolidaySolar(item)}`),
			createEl("span", "le-am", formatHolidayLunar(item)),
			name
		);
		appendCountdown(row, item, isNext);
		row.append(remove);
		return row;
	}

	function createPersonalHead() {
		const add = createEl("button", "nho-them", "Thêm ngày");
		add.type = "button";
		add.dataset.action = "nho-them";
		const head = createEl("div", "le-dau nho-dau");
		head.append(createEl("span", "nho-ten", "Ngày cần nhớ"), add);
		return head;
	}

	function showPersonalDays() {
		const items = collectUpcomingPersonalDays(personalDays, UPCOMING_MONTHS);
		const list = createEl("ul", "le-ds nho-ds");
		for (const [i, item] of items.entries()) {
			list.append(createPersonalRow(item, i === 0));
		}
		document.getElementById("personal").replaceChildren(createPersonalHead(), list);
	}

	function deletePersonalDay(id) {
		savePersonalDays(personalDays.filter((entry) => entry.id !== id));
		showPersonalDays();
	}

	function createNhoField(labelText, field) {
		const wrap = createEl("label", "nho-truong");
		wrap.append(createEl("span", "nho-nhan", labelText), field);
		return wrap;
	}

	function createNhoSelect(field, start, end, selected, prefix) {
		const select = createEl("select", "nho-nhap");
		select.dataset.field = field;
		for (let n = start; n <= end; n++) {
			const option = createEl("option", null, prefix ? `${prefix} ${n}` : String(n));
			option.value = String(n);
			select.append(option);
		}
		select.value = String(selected);
		return select;
	}

	function createNhoPanel() {
		const todayLunar = getCurrentLunarToday();
		const name = createEl("input", "nho-nhap");
		name.type = "text";
		name.dataset.field = "name";
		name.maxLength = PERSONAL_NAME_MAX;
		name.placeholder = "Giỗ ông, sinh nhật…";

		const day = createNhoSelect("day", 1, 30, todayLunar.day);
		const month = createNhoSelect("month", 1, 12, todayLunar.month, "Tháng");
		const row = createEl("div", "nho-hang");
		row.append(createNhoField("Ngày âm", day), createNhoField("Tháng âm", month));

		const cancel = createEl("button", "nho-huy", "Hủy");
		cancel.type = "button";
		cancel.dataset.action = "nho-huy";
		const save = createEl("button", "nho-luu", "Lưu");
		save.type = "button";
		save.dataset.action = "nho-luu";
		const actions = createEl("div", "nho-nut");
		actions.append(cancel, save);

		const head = createEl("div", "hop-dau");
		head.append(
			createEl("div", "hop-dem"),
			createEl("div", "hop-ten", "Thêm ngày cần nhớ"),
			createNavButton("close-picker", "×", "Đóng", false)
		);

		const panel = createEl("div", "hop-chon nho-hop");
		panel.dataset.action = "nho-panel";
		panel.append(head, createNhoField("Tên", name), row, actions);
		return panel;
	}

	function openNhoForm() {
		pickerKind = "nho";
		renderPicker();
	}

	function saveNhoForm() {
		const panel = document.getElementById("picker").querySelector(".nho-hop");
		if (!panel) {
			return;
		}
		const nameNode = panel.querySelector('[data-field="name"]');
		const dayNode = panel.querySelector('[data-field="day"]');
		const monthNode = panel.querySelector('[data-field="month"]');
		const name = String((nameNode && nameNode.value) || "").trim();
		const lunarDay = Number(dayNode && dayNode.value);
		const lunarMonth = Number(monthNode && monthNode.value);
		if (!name || name.length > PERSONAL_NAME_MAX) {
			return;
		}
		if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) {
			return;
		}
		if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
			return;
		}
		savePersonalDays(personalDays.concat([{
			id: createPersonalId(),
			name,
			lunarDay,
			lunarMonth
		}]));
		showPersonalDays();
		closePicker();
	}

	function showMonth(mm, yy) {
		const table = createMonthTable(mm, yy);
		if (!table) {
			return;
		}
		viewMonth = mm;
		viewYear = yy;
		document.getElementById("content").replaceChildren(table);
		selectedCell = null;
		if (selectedJd !== null) {
			selectCell(document.querySelector(`td[data-jd="${selectedJd}"]`));
		}
	}

	function showYear(yy) {
		viewYear = yy;
		document.getElementById("content").replaceChildren(createYearTable(yy));
		selectedCell = null;
	}

	function shiftMonth(delta) {
		let mm = viewMonth + delta;
		let yy = viewYear;
		if (mm < 1) {
			mm = 12;
			yy -= 1;
		} else if (mm > 12) {
			mm = 1;
			yy += 1;
		}
		showMonth(mm, yy);
	}

	function createMonthGrid() {
		const grid = createEl("div", "hop-luoi luoi-thang");
		for (let mm = 1; mm <= 12; mm++) {
			const cell = createEl("button", mm === viewMonth ? "hop-o chon" : "hop-o", `Tháng ${mm}`);
			cell.type = "button";
			cell.dataset.action = "pick-month";
			cell.dataset.month = mm;
			grid.append(cell);
		}
		return grid;
	}

	function createYearGrid() {
		const grid = createEl("div", "hop-luoi luoi-nam");
		for (let i = 0; i < YEARS_PER_PAGE; i++) {
			const yy = yearPageBase - YEAR_PAGE_HALF + i;
			const cell = createEl("button", yy === viewYear ? "hop-o chon" : "hop-o", yy);
			cell.type = "button";
			cell.disabled = yy < MIN_YEAR || yy > MAX_YEAR;
			cell.dataset.action = "pick-year";
			cell.dataset.year = yy;
			grid.append(cell);
		}
		return grid;
	}

	function createPickerHead(kind) {
		const head = createEl("div", "hop-dau");
		head.append(createEl("div", "hop-dem"));
		if (kind === "year") {
			const first = yearPageBase - YEAR_PAGE_HALF;
			head.append(
				createNavButton("prev-year-page", "‹", "Trang trước", yearPageBase - YEAR_PAGE_HALF - 1 < MIN_YEAR),
				createEl("div", "hop-ten", `${first}–${first + YEARS_PER_PAGE - 1}`),
				createNavButton("next-year-page", "›", "Trang sau", yearPageBase + YEAR_PAGE_HALF + 1 > MAX_YEAR)
			);
		} else {
			head.append(createEl("div", "hop-ten", `Chọn tháng năm ${viewYear}`));
		}
		head.append(createNavButton("close-picker", "×", "Đóng", false));
		return head;
	}

	function createPickerPanel(kind) {
		const panel = createEl("div", "hop-chon");
		panel.dataset.action = "picker-panel";
		panel.append(createPickerHead(kind), kind === "year" ? createYearGrid() : createMonthGrid());
		return panel;
	}

	function renderPicker() {
		const root = document.getElementById("picker");
		if (pickerKind === "nho") {
			root.replaceChildren(createNhoPanel());
			return;
		}
		root.replaceChildren(createPickerPanel(pickerKind));
	}

	function closePicker() {
		pickerKind = null;
		document.getElementById("picker").replaceChildren();
	}

	function openPicker(kind) {
		pickerKind = kind;
		yearPageBase = viewYear;
		renderPicker();
	}

	function shiftYearPage(delta) {
		yearPageBase += delta * YEARS_PER_PAGE;
		renderPicker();
	}

	function alertAbout() {
		alert(ABOUT);
	}

	function findActionNode(event) {
		let node = event.target;
		while (node && node !== event.currentTarget) {
			if (node.dataset?.action) {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	}

	function handleCalendarClick(event) {
		const node = findActionNode(event);
		switch (node?.dataset.action) {
			case "day-info":
				showDayInfoForCell(node);
				return;
			case "holiday-jump":
				jumpToHoliday(node);
				return;
			case "nho-jump":
				jumpToHoliday(node);
				return;
			case "nho-them":
				openNhoForm();
				return;
			case "nho-xoa":
				deletePersonalDay(node.dataset.id);
				return;
			case "prev-month":
				shiftMonth(-1);
				return;
			case "next-month":
				shiftMonth(1);
				return;
			case "prev-year":
				showMonth(viewMonth, viewYear - 1);
				return;
			case "next-year":
				showMonth(viewMonth, viewYear + 1);
				return;
			case "open-month-picker":
				openPicker("month");
				return;
			case "open-year-picker":
				openPicker("year");
				return;
			case "about":
				alertAbout();
				return;
		}
	}

	function handlePickerClick(event) {
		const node = findActionNode(event);
		switch (node?.dataset.action) {
			case "pick-month":
				showMonth(Number(node.dataset.month), viewYear);
				closePicker();
				return;
			case "pick-year":
				showMonth(viewMonth, Number(node.dataset.year));
				closePicker();
				return;
			case "prev-year-page":
				shiftYearPage(-1);
				return;
			case "next-year-page":
				shiftYearPage(1);
				return;
			case "picker-panel":
			case "nho-panel":
				return;
			case "nho-luu":
				saveNhoForm();
				return;
			default:
				closePicker();
		}
	}

	window.onload = () => {
		document.getElementById("content").addEventListener("click", handleCalendarClick);
		document.getElementById("personal").addEventListener("click", handleCalendarClick);
		document.getElementById("holidays").addEventListener("click", handleCalendarClick);
		document.getElementById("picker").addEventListener("click", handlePickerClick);
		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				closePicker();
			}
		});
		showTodayInfo();
		showUpcomingHolidays();
		showPersonalDays();
		showMonth(getCurrentMonth(), getCurrentYear());
		loadPersonalDays((entries) => {
			personalDays = entries;
			showPersonalDays();
		});
	};

})(window);
