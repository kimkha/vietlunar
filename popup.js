(function(window) {

	var ABOUT = "Âm lịch Việt Nam - Version 0.8\n© 2004 Hồ Ngọc Đức [http://come.to/duc]";
	var DAYNAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
	var DAYNAMES_FULL = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
	var MIN_YEAR = 1800;
	var MAX_YEAR = 2199;
	var UPCOMING_MONTHS = 12;

	var LUNAR_HOLIDAYS = {
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

	var SOLAR_HOLIDAYS = {
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
	var TET_CONTINUATION = { "2/1": true, "3/1": true };

	// Chốt danh sách cho box "sắp tới": thêm khoá vào LUNAR_HOLIDAYS không tự vào box
	// "bold" = lễ âm được nghỉ chính thức
	var UPCOMING_LUNAR_HOLIDAYS = {
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

	var dayByCell = new WeakMap();
	var holidayByRow = new WeakMap();
	var selectedCell = null;
	var selectedJd = null;
	var viewMonth = 0;
	var viewYear = 0;

	function createEl(tag, className, text) {
		var node = document.createElement(tag);
		if (className) {
			node.className = className;
		}
		if (text !== undefined) {
			node.textContent = String(text);
		}
		return node;
	}

	function createNavButton(action, label, hint, disabled) {
		var button = createEl("button", null, label);
		button.type = "button";
		button.title = hint;
		button.disabled = disabled;
		button.dataset.action = action;
		return button;
	}

	function createNavRow(mm, yy) {
		var row = document.createElement("tr");

		var left = createEl("td", "navi-l");
		left.colSpan = 2;
		left.append(
			createNavButton("prev-year", "<<", "Năm trước", yy - 1 < MIN_YEAR),
			createNavButton("prev-month", "<", "Tháng trước", mm === 1 && yy - 1 < MIN_YEAR)
		);

		var title = createEl("td", "tenthang", mm + "/" + yy);
		title.colSpan = 3;
		title.dataset.action = "show-month-select";

		var right = createEl("td", "navi-r");
		right.colSpan = 2;
		right.append(
			createNavButton("next-month", ">", "Tháng sau", mm === 12 && yy + 1 > MAX_YEAR),
			createNavButton("next-year", ">>", "Năm sau", yy + 1 > MAX_YEAR)
		);

		row.append(left, title, right);
		return row;
	}

	function createWeekdayRow() {
		var row = document.createElement("tr");
		row.dataset.action = "about";
		for (var i = 0; i < DAYNAMES.length; i++) {
			row.append(createEl("td", "ngaytuan", DAYNAMES[i]));
		}
		return row;
	}

	function createDayCell(lunar, sday, smonth, syear) {
		var today = getToday();
		var isToday = sday === today.getDate()
			&& smonth === today.getMonth() + 1
			&& syear === today.getFullYear();
		var isHoliday = getHolidayNames(lunar, sday, smonth).length > 0;

		var cell = createEl("td", isHoliday ? "tet" : (isToday ? "homnay" : "ngaythang"));
		cell.title = getDayName(lunar);
		cell.dataset.action = "day-info";
		cell.dataset.jd = lunar.jd;
		dayByCell.set(cell, { lunar: lunar, sday: sday, smonth: smonth, syear: syear });

		var dow = (lunar.jd + 1) % 7;
		var solarClass = dow === 0 ? "cn" : (dow === 6 ? "t7" : "t2t6");
		var lunarLabel = (sday === 1 || lunar.day === 1)
			? lunar.day + "/" + lunar.month
			: lunar.day;
		cell.append(
			createEl("div", solarClass, sday),
			createEl("div", lunar.leap === 1 ? "am2" : "am", lunarLabel)
		);
		return cell;
	}

	function createMonthTable(mm, yy) {
		var days = getMonth(mm, yy);
		if (days.length === 0) {
			return null;
		}
		var leadingBlanks = (days[0].jd + 1) % 7;
		var body = document.createElement("tbody");
		body.append(createNavRow(mm, yy), createWeekdayRow());

		for (var week = 0; week < 6; week++) {
			if (7 * week >= leadingBlanks + days.length) {
				break;
			}
			var row = document.createElement("tr");
			for (var slot = 0; slot < 7; slot++) {
				var index = 7 * week + slot - leadingBlanks;
				if (index < 0 || index >= days.length) {
					row.append(createEl("td", "ngaythang"));
				} else {
					row.append(createDayCell(days[index], index + 1, mm, yy));
				}
			}
			body.append(row);
		}

		var table = createEl("table", "thang");
		table.append(body);
		return table;
	}

	function createYearTable(yy) {
		var body = document.createElement("tbody");

		var title = createEl("td", "tennam", "Năm " + getYearCanChi(yy) + " " + yy);
		title.colSpan = 3;
		title.dataset.action = "show-year-select";
		var titleRow = document.createElement("tr");
		titleRow.append(title);
		body.append(titleRow);

		var row = null;
		for (var mm = 1; mm <= 12; mm++) {
			if (mm % 3 === 1) {
				row = document.createElement("tr");
			}
			var cell = document.createElement("td");
			var month = createMonthTable(mm, yy);
			if (month) {
				cell.append(month);
			}
			row.append(cell);
			if (mm % 3 === 0) {
				body.append(row);
			}
		}

		var table = createEl("table", "nam");
		table.append(body);
		return table;
	}

	function createGioHoangDao(jd) {
		var cell = createEl("dd", "tin-gio");
		var parts = getGioHoangDao(jd).split(",");
		for (var i = 0; i < parts.length; i++) {
			var gio = parts[i].replace(/\s+/g, " ").trim();
			if (gio.length > 0) {
				cell.append(createEl("span", "gio", gio));
			}
		}
		return cell;
	}

	// Không kèm "(nhuận)" như tooltip: dòng âm lịch ngay trên đã ghi, và giữ can chi gọn 1 dòng
	function formatCanChi(lunar) {
		var cc = getCanChi(lunar);
		return "Ngày " + cc[0] + ", tháng " + cc[1] + ", năm " + cc[2];
	}

	function getHolidayNames(lunar, sday, smonth) {
		var names = [];
		if (lunar.leap !== 1) {
			var lunarName = LUNAR_HOLIDAYS[lunar.day + "/" + lunar.month];
			if (lunarName) {
				names.push(lunarName);
			}
		}
		var solarName = SOLAR_HOLIDAYS[sday + "/" + smonth];
		if (solarName) {
			names.push(solarName);
		}
		return names;
	}

	function createDayInfo(lunar, sday, smonth, syear) {
		var dow = (lunar.jd + 1) % 7;
		var isLeap = lunar.leap === 1;

		var solarClass = "tin-duong" + (dow === 0 ? " tin-cn" : (dow === 6 ? " tin-t7" : ""));
		var lunarText = "Ngày " + lunar.day + " tháng " + lunar.month
			+ (isLeap ? " nhuận" : "") + " ÂL";
		var dates = createEl("div", "tin-ngay");
		dates.append(
			createEl("div", solarClass, DAYNAMES_FULL[dow] + ", " + sday + "/" + smonth + "/" + syear),
			createEl("div", isLeap ? "tin-am tin-nhuan" : "tin-am", lunarText)
		);

		var head = createEl("div", "tin-dau");
		head.append(dates);

		var holidays = getHolidayNames(lunar, sday, smonth);
		if (holidays.length > 0) {
			head.append(createEl("div", "tin-le", holidays.join(" · ")));
		}

		var list = createEl("dl", "tin-bang");
		list.append(
			createEl("dt", null, "Can chi"),
			createEl("dd", null, formatCanChi(lunar)),
			createEl("dt", null, "Giờ đầu"),
			createEl("dd", null, getCanHour0(lunar.jd) + " " + CHI[0]),
			createEl("dt", null, "Tiết"),
			createEl("dd", null, TIETKHI[getSunLongitude(lunar.jd + 1, 7.0)]),
			createEl("dt", null, "Giờ hoàng đạo"),
			createGioHoangDao(lunar.jd)
		);

		var info = document.createDocumentFragment();
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
		var day = dayByCell.get(cell);
		if (!day) {
			return;
		}
		showDayInfo(day.lunar, day.sday, day.smonth, day.syear);
		selectCell(cell);
	}

	function showTodayInfo() {
		var today = getToday();
		showDayInfo(getCurrentLunarToday(), today.getDate(), today.getMonth() + 1, today.getFullYear());
	}

	function collectUpcomingLunarHolidays(monthCount) {
		var today = getToday();
		var todayJd = getCurrentLunarToday().jd;
		var items = [];

		for (var k = 0; k < monthCount; k++) {
			var offset = today.getMonth() + k;
			var mm = (offset % 12) + 1;
			var yy = today.getFullYear() + Math.floor(offset / 12);
			if (yy > MAX_YEAR) {
				break;
			}
			var days = getMonth(mm, yy);
			for (var i = 0; i < days.length; i++) {
				var lunar = days[i];
				if (lunar.jd < todayJd || lunar.leap === 1) {
					continue;
				}
				var key = lunar.day + "/" + lunar.month;
				var name = LUNAR_HOLIDAYS[key];
				if (!name || !UPCOMING_LUNAR_HOLIDAYS[key]) {
					continue;
				}

				var last = items[items.length - 1];
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
					lunar: lunar,
					lunarDay: lunar.day,
					lunarMonth: lunar.month,
					endLunarDay: lunar.day,
					sday: i + 1,
					smonth: mm,
					syear: yy,
					endDay: i + 1,
					endMonth: mm,
					endYear: yy,
					name: name,
					isMajor: UPCOMING_LUNAR_HOLIDAYS[key] === "bold"
				});
			}
		}
		return items;
	}

	function formatHolidaySolar(item) {
		if (item.endJd === item.jd) {
			return item.sday + "/" + item.smonth + "/" + item.syear;
		}
		if (item.smonth === item.endMonth && item.syear === item.endYear) {
			return item.sday + "–" + item.endDay + "/" + item.smonth + "/" + item.syear;
		}
		return item.sday + "/" + item.smonth + "–" + item.endDay + "/" + item.endMonth + "/" + item.endYear;
	}

	function formatHolidayLunar(item) {
		var day = item.endLunarDay === item.lunarDay
			? item.lunarDay
			: item.lunarDay + "–" + item.endLunarDay;
		return day + "/" + item.lunarMonth + " ÂL";
	}

	function formatCountdown(days) {
		if (days <= 0) {
			return "hôm nay";
		}
		if (days === 1) {
			return "mai";
		}
		return "còn " + days + " ngày";
	}

	function createHolidayRow(item, isNext) {
		var row = createEl("li", "le-dong");
		row.dataset.action = "holiday-jump";
		row.title = "Xem ngày " + formatHolidaySolar(item);
		holidayByRow.set(row, item);
		row.append(
			createEl("span", "le-duong", formatHolidaySolar(item)),
			createEl("span", "le-am", formatHolidayLunar(item)),
			createEl("span", item.isMajor ? "le-ten le-chinh" : "le-ten", item.name)
		);
		if (isNext) {
			row.append(createEl("span", "le-con", formatCountdown(item.jd - getCurrentLunarToday().jd)));
		}
		return row;
	}

	function createHolidayList() {
		var items = collectUpcomingLunarHolidays(UPCOMING_MONTHS);
		if (items.length === 0) {
			return null;
		}
		var list = createEl("ul", "le-ds");
		for (var i = 0; i < items.length; i++) {
			list.append(createHolidayRow(items[i], i === 0));
		}

		var box = document.createDocumentFragment();
		box.append(createEl("div", "le-dau", "Ngày lễ âm lịch sắp tới"), list);
		return box;
	}

	function showUpcomingHolidays() {
		var box = createHolidayList();
		if (box) {
			document.getElementById("holidays").replaceChildren(box);
		}
	}

	function jumpToHoliday(row) {
		var item = holidayByRow.get(row);
		if (!item) {
			return;
		}
		// showDayInfo đặt selectedJd trước, để showMonth chọn đúng ô
		showDayInfo(item.lunar, item.sday, item.smonth, item.syear);
		showMonth(item.smonth, item.syear);
	}

	function showMonth(mm, yy) {
		var table = createMonthTable(mm, yy);
		if (!table) {
			return;
		}
		viewMonth = mm;
		viewYear = yy;
		document.getElementById("content").replaceChildren(table);
		selectedCell = null;
		if (selectedJd !== null) {
			selectCell(document.querySelector('td[data-jd="' + selectedJd + '"]'));
		}
	}

	function showYear(yy) {
		viewYear = yy;
		document.getElementById("content").replaceChildren(createYearTable(yy));
		selectedCell = null;
	}

	function shiftMonth(delta) {
		var mm = viewMonth + delta;
		var yy = viewYear;
		if (mm < 1) {
			mm = 12;
			yy -= 1;
		} else if (mm > 12) {
			mm = 1;
			yy += 1;
		}
		showMonth(mm, yy);
	}

	function showMonthSelect() {
		var home = "http://www.informatik.uni-leipzig.de/~duc/amlich/JavaScript/";
		window.open(home, "win2702", "menubar=yes,scrollbars=yes,status=yes,toolbar=yes,resizable=yes,location=yes");
	}

	function showYearSelect() {
		window.print();
	}

	function alertAbout() {
		alert(ABOUT);
	}

	function handleCalendarClick(event) {
		var node = event.target;
		while (node && node !== event.currentTarget) {
			switch (node.dataset && node.dataset.action) {
				case "day-info":
					showDayInfoForCell(node);
					return;
				case "holiday-jump":
					jumpToHoliday(node);
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
				case "show-month-select":
					showMonthSelect();
					return;
				case "show-year-select":
					showYearSelect();
					return;
				case "about":
					alertAbout();
					return;
			}
			node = node.parentNode;
		}
	}

	window.onload = function() {
		document.getElementById("content").addEventListener("click", handleCalendarClick);
		document.getElementById("holidays").addEventListener("click", handleCalendarClick);
		showTodayInfo();
		showUpcomingHolidays();
		showMonth(getCurrentMonth(), getCurrentYear());
	};

})(window);
