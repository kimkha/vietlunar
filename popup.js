(function(window) {

	var ABOUT = "Âm lịch Việt Nam - Version 0.8\n© 2004 Hồ Ngọc Đức [http://come.to/duc]";
	var DAYNAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
	var DAYNAMES_FULL = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
	var MIN_YEAR = 1800;
	var MAX_YEAR = 2199;

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

	var dayByCell = new WeakMap();
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
		showTodayInfo();
		showMonth(getCurrentMonth(), getCurrentYear());
	};

})(window);
