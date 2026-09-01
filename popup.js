(function(window) {

	var ABOUT = "\u00C2m l\u1ECBch Vi\u1EC7t Nam - Version 0.8"+"\n\u00A9 2004 H\u1ED3 Ng\u1ECDc \u0110\u1EE9c [http://come.to/duc]";
	var DAYNAMES = new Array("CN", "T2", "T3", "T4", "T5", "T6", "T7");

	function printSelectedMonth() {
		getSelectedMonth();
		return printMonth(getCurrentMonth(), getCurrentYear());
	}

	function printMonth(mm, yy) {
		return printTable(mm, yy);
	}

	function printYear(yy) {
		var yearName = "N&#x103;m " + getYearCanChi(yy) + " " + yy;
		var res = "";
		res += '<table class="nam">\n';
		res += ('<tr><td colspan="3" class="tennam" data-action="show-year-select">'+yearName+'</td></tr>\n');
		for (var i = 1; i<= 12; i++) {
			if (i % 3 == 1) res += '<tr>\n';
			res += '<td>\n';
			res += printTable(i, yy);
			res += '</td>\n';
			if (i % 3 == 0) res += '</tr>\n';
		}
		res += '</table>\n';
		return res;
	}

	function printSelectedYear() {
		getSelectedMonth();
		return printYear(getCurrentYear());
	}

	function printTable(mm, yy) {
		var i, j, k, solar, lunar, cellClass, solarClass, lunarClass;
		var currentMonth = getMonth(mm, yy);
		if (currentMonth.length == 0) return;
		var ld1 = currentMonth[0];
		var emptyCells = (ld1.jd + 1) % 7;
		var MonthHead = mm + "/" + yy;
		var LunarHead = getYearCanChi(ld1.year);
		var res = "";
		res += ('<table class="thang">\n');
		res += printHead(mm, yy);
		for (i = 0; i < 6; i++) {
			if (7 * i >= emptyCells + currentMonth.length) break;
			res += ("<tr>\n");
			for (j = 0; j < 7; j++) {
				k = 7 * i + j;
				if (k < emptyCells || k >= emptyCells + currentMonth.length) {
					res += printEmptyCell();
				} else {
					solar = k - emptyCells + 1;
					ld1 = currentMonth[k - emptyCells];
					res += printCell(ld1, solar, mm, yy);
				}
			}
			res += ("</tr>\n");
		}
		res += ('</table>\n');
		return res;
	}

	function getPrevMonthLink(mm, yy) {
		var mm1 = mm > 1 ? mm-1 : 12;
		var yy1 = mm > 1 ? yy : yy-1;
		//return '<a href="'+window.location.pathname+'?yy='+yy1+'&mm='+mm1+'"><img src="left1.gif" width=8 height=12 alt="PrevMonth" border=0></a>';
		return '<a href="'+window.location.pathname+'?yy='+yy1+'&mm='+mm1+'">&lt;</a>';
	}

	function getNextMonthLink(mm, yy) {
		var mm1 = mm < 12 ? mm+1 : 1;
		var yy1 = mm < 12 ? yy : yy+1;
		//return '<a href="'+window.location.pathname+'?yy='+yy1+'&mm='+mm1+'"><img src="right1.gif" width=8 height=12 alt="NextMonth" border=0></a>';
		return '<a href="'+window.location.pathname+'?yy='+yy1+'&mm='+mm1+'">&gt;</a>';
	}

	function getPrevYearLink(mm, yy) {
		//return '<a href="'+window.location.pathname+'?yy='+(yy-1)+'&mm='+mm+'"><img src="left2.gif" width=16 height=12 alt="PrevYear" border=0></a>';
		return '<a href="'+window.location.pathname+'?yy='+(yy-1)+'&mm='+mm+'">&lt;&lt;</a>';
	}

	function getNextYearLink(mm, yy) {
		//return '<a href="'+window.location.pathname+'?yy='+(yy+1)+'&mm='+mm+'"><img src="right2.gif" width=16 height=12 alt="NextYear" border=0></a>';
		return '<a href="'+window.location.pathname+'?yy='+(yy+1)+'&mm='+mm+'">&gt;&gt;</a>';
	}

	function printHead(mm, yy) {
		var res = "";
		var monthName = mm+"/"+yy;
		//res += ('<tr><td colspan="7" class="tenthang" onClick="showMonthSelect();">'+monthName+'</td></tr>\n');
		res += ('<tr><td colspan="2" class="navi-l">'+getPrevYearLink(mm, yy)+' &nbsp;'+getPrevMonthLink(mm, yy)+'</td>\n');
		//res += ('<td colspan="1" class="navig"><a href="'+getPrevMonthLink(mm, yy)+'"><img src="left1.gif" alt="Prev"></a></td>\n');
		res += ('<td colspan="3" class="tenthang" data-action="show-month-select">'+monthName+'</td>\n');
		//res += ('<td colspan="1" class="navi-r"><a href="'+getNextMonthLink(mm, yy)+'"><img src="right1.gif" alt="Next"></a></td>\n');
		res += ('<td colspan="2" class="navi-r">'+getNextMonthLink(mm, yy)+' &nbsp;'+getNextYearLink(mm, yy)+'</td></tr>\n');
		//res += ('<tr><td colspan="7" class="tenthang"><a href="'+getNextMonthLink(mm, yy)+'"><img src="right.gif" alt="Next"></a></td></tr>\n');
		res += ('<tr data-action="about">\n');
		for(var i=0;i<=6;i++) {
			res += ('<td class="ngaytuan">'+DAYNAMES[i]+'</td>\n');
		}
		res += ('<\/tr>\n');
		return res;
	}

	function printEmptyCell() {
			return '<td class="ngaythang"><div class="cn">&nbsp;</div> <div class="am">&nbsp;</div></td>\n';
	}

	function printCell(lunarDate, solarDate, solarMonth, solarYear) {
		var cellClass, solarClass, lunarClass;
		cellClass = "ngaythang";
		solarClass = "t2t6";
		lunarClass = "am";
		var dow = (lunarDate.jd + 1) % 7;
		if (dow == 0) {
			solarClass = "cn";
		} else if (dow == 6) {
			solarClass = "t7";
		}
		var today = getToday();
		if (solarDate == today.getDate() && solarMonth == today.getMonth()+1 && solarYear == today.getFullYear()) {
			cellClass = "homnay";
		}
		if (lunarDate.day == 1 && lunarDate.month == 1) {
			cellClass = "tet";
		}
		if (lunarDate.leap == 1) {
			lunarClass = "am2";
		}
		var lunar = lunarDate.day;
		if (solarDate == 1 || lunar == 1) {
			lunar = lunarDate.day + "/" + lunarDate.month;
		}
		var res = "";
		res += ('<td class="'+cellClass+'"');
		if (lunarDate != null) {
			res += ' title="'+getDayName(lunarDate)+'"';
			res += ' data-action="day-info"';
			res += ' data-dd="'+lunarDate.day+'"';
			res += ' data-mm="'+lunarDate.month+'"';
			res += ' data-yy="'+lunarDate.year+'"';
			res += ' data-leap="'+lunarDate.leap+'"';
			res += ' data-jd="'+lunarDate.jd+'"';
			res += ' data-sday="'+solarDate+'"';
			res += ' data-smonth="'+solarMonth+'"';
			res += ' data-syear="'+solarYear+'"';
		}
		res += '>';
		res += (' <div class="'+solarClass+'">'+solarDate+'</div> <div class="'+lunarClass+'">'+lunar+'</div></td>\n');
		return res;
	}

	function printFoot() {
		var res = "";
		res += '<script language="JavaScript" src="amlich-hnd.js"></script>\n';
		return res;
	}

	function showMonthSelect() {
		var home = "http://www.informatik.uni-leipzig.de/~duc/amlich/JavaScript/";
		window.open(home, "win2702", "menubar=yes,scrollbars=yes,status=yes,toolbar=yes,resizable=yes,location=yes");
		//window.location = home;
		//alertAbout();
	}

	function showYearSelect() {
		//window.open("selectyear.html", "win2702", "menubar=yes,scrollbars=yes");
		window.print();
	}

	/*
	function infoCellSelect(id) {
		if (id == 0) {
		}
	}
	*/

	function alertDayInfo(dd, mm, yy, leap, jd, sday, smonth, syear) {
		var lunar = new LunarDate(dd, mm, yy, leap, jd);
		var s = getDayString(lunar, sday, smonth, syear);
		s += " \u00E2m l\u1ECBch\n";
		s += getDayName(lunar);
		s += "\nGi\u1EDD \u0111\u1EA7u ng\u00E0y: "+getCanHour0(jd)+" "+CHI[0];
		s += "\nTi\u1EBFt: "+TIETKHI[getSunLongitude(jd+1, 7.0)];
		s += "\nGi\u1EDD ho\u00E0ng \u0111\u1EA1o: "+getGioHoangDao(jd);
		alert(s);
	}

	function alertAbout() {
		alert(ABOUT);
	}

	function showVietCal() {
		window.status = getCurrentTime() + " -+- " + getTodayString();
		window.setTimeout("showVietCal()",5000);
	}

	function handleCalendarClick(event) {
		var target = event.target;
		while (target && target !== event.currentTarget) {
			var action = target.getAttribute("data-action");
			if (action === "day-info") {
				alertDayInfo(
					parseInt(target.getAttribute("data-dd"), 10),
					parseInt(target.getAttribute("data-mm"), 10),
					parseInt(target.getAttribute("data-yy"), 10),
					parseInt(target.getAttribute("data-leap"), 10),
					parseInt(target.getAttribute("data-jd"), 10),
					parseInt(target.getAttribute("data-sday"), 10),
					parseInt(target.getAttribute("data-smonth"), 10),
					parseInt(target.getAttribute("data-syear"), 10)
				);
				return;
			}
			if (action === "show-month-select") {
				showMonthSelect();
				return;
			}
			if (action === "show-year-select") {
				showYearSelect();
				return;
			}
			if (action === "about") {
				alertAbout();
				return;
			}
			target = target.parentNode;
		}
	}

	window.onload = function(){
		var content = document.getElementById("content");
		content.addEventListener("click", handleCalendarClick);
		content.innerHTML = printSelectedMonth();
	}

})(window);
