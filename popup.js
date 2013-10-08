
var ABOUT = "\u00C2m l\u1ECBch Vi\u1EC7t Nam - Version 0.8"+"\n\u00A9 2004 H\u1ED3 Ng\u1ECDc \u0110\u1EE9c [http://come.to/duc]";
var DAYNAMES = new Array("CN", "T2", "T3", "T4", "T5", "T6", "T7");
var PRINT_OPTS = new OutputOptions();
var FONT_SIZES = new Array("9pt", "13pt", "17pt");
var TAB_WIDTHS = new Array("180px", "420px", "600px");

function OutputOptions() {
	this.fontSize = "13pt";
	this.tableWidth = "420px";
}

function setOutputSize(size) {
	var idx = 1;
	if (size == "small") {
		idx = 0;
	} else if (size == "big") {
		idx = 2;
	} else {
		idx = 1;
	}
	PRINT_OPTS.fontSize = FONT_SIZES[idx];
	PRINT_OPTS.tableWidth = TAB_WIDTHS[idx];
}

function printSelectedMonth() {
	getSelectedMonth();
	return printMonth(currentMonth, currentYear);
}

function printMonth(mm, yy) {
	var res = "";
	res += printStyle();
	res += printTable(mm, yy);
	//res += printFoot();
	return res;
}

function printYear(yy) {
	var yearName = "N&#x103;m " + getYearCanChi(yy) + " " + yy;
	var res = "";
	res += printStyle();
	res += '<table align=center>\n';
	res += ('<tr><td colspan="3" class="tennam" onClick="showYearSelect();">'+yearName+'</td></tr>\n');
	for (var i = 1; i<= 12; i++) {
		if (i % 3 == 1) res += '<tr>\n';
		res += '<td>\n';
		res += printTable(i, yy);
		res += '</td>\n';
		if (i % 3 == 0) res += '</tr>\n';
	}
	res += '<table>\n';
	//res += printFoot();
	return res;
}

function printSelectedYear() {
	getSelectedMonth();
	return printYear(currentYear);
}

function printStyle() {
	var fontSize = PRINT_OPTS.fontSize;
	var res = "";
	res += '<style type="text/css">\n';
	res += '<!--\n';
	//res += '  body {margin:0}\n';
	res += '  .tennam {text-align:center; font-size:150%; line-height:120%; font-weight:bold; color:#000000; background-color: #CCCCCC}\n';
	res += '  .thang {font-size: '+fontSize+'; padding:1; line-height:100%; font-family:Tahoma,Verdana,Arial; table-layout:fixed}\n';
	res += '  .tenthang {text-align:center; font-size:125%; line-height:100%; font-weight:bold; color:#330033; background-color: #CCFFCC}\n';
	res += '  .navi-l {text-align:center; font-size:75%; line-height:100%; font-family:Verdana,Times New Roman,Arial; font-weight:bold; color:red; background-color: #CCFFCC}\n';
	res += '  .navi-r {text-align:center; font-size:75%; line-height:100%; font-family:Verdana,Arial,Times New Roman; font-weight:bold; color:#330033; background-color: #CCFFCC}\n';
	res += '  .ngaytuan {width:14%; text-align:center; font-size:125%; line-height:100%; color:#330033; background-color: #FFFFCC}\n';
	res += '  .ngaythang {background-color:#FDFDF0}\n';
	res += '  .homnay {background-color:#FFF000}\n';
	res += '  .tet {background-color:#FFCC99}\n';
	res += '  .am {text-align:right;font-size:75%;line-height:100%;color:blue}\n';
	res += '  .am2 {text-align:right;font-size:75%;line-height:100%;color:#004080}\n';
	res += '  .t2t6 {text-align:left;font-size:125%;color:black}\n';
	res += '  .t7 {text-align:left;font-size:125%;line-height:100%;color:green}\n';
	res += '  .cn {text-align:left;font-size:125%;line-height:100%;color:red}\n';
	res += '-->\n';
	res += '</style>\n';
	return res;
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
	res += ('<table class="thang" border="2" cellpadding="1" cellspacing="1" width="'+PRINT_OPTS.tableWidth+'">\n');
	res += printHead(mm, yy);
	for (i = 0; i < 6; i++) {
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
	res += ('<td colspan="3" class="tenthang" onClick="showMonthSelect();">'+monthName+'</td>\n');
	//res += ('<td colspan="1" class="navi-r"><a href="'+getNextMonthLink(mm, yy)+'"><img src="right1.gif" alt="Next"></a></td>\n');
	res += ('<td colspan="2" class="navi-r">'+getNextMonthLink(mm, yy)+' &nbsp;'+getNextYearLink(mm, yy)+'</td></tr>\n');
	//res += ('<tr><td colspan="7" class="tenthang"><a href="'+getNextMonthLink(mm, yy)+'"><img src="right.gif" alt="Next"></a></td></tr>\n');
	res += ('<tr onClick="alertAbout();">\n');
	for(var i=0;i<=6;i++) {
		res += ('<td class=ngaytuan>'+DAYNAMES[i]+'</td>\n');
	}
	res += ('<\/tr>\n');
	return res;
}

function printEmptyCell() {
		return '<td class=ngaythang><div class=cn>&nbsp;</div> <div class=am>&nbsp;</div></td>\n';
}

function printCell(lunarDate, solarDate, solarMonth, solarYear) {
	var cellClass, solarClass, lunarClass, solarColor;
	cellClass = "ngaythang";
	solarClass = "t2t6";
	lunarClass = "am";
	solarColor = "black";
	var dow = (lunarDate.jd + 1) % 7;
	if (dow == 0) {
		solarClass = "cn";
		solarColor = "red";
	} else if (dow == 6) {
		solarClass = "t7";
		solarColor = "green";
	}
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
	var args = lunarDate.day + "," + lunarDate.month + "," + lunarDate.year + "," + lunarDate.leap;
	args += ("," + lunarDate.jd + "," + solarDate + "," + solarMonth + "," + solarYear);
	res += ('<td class="'+cellClass+'"');
	if (lunarDate != null) res += (' title="'+getDayName(lunarDate)+'" onClick="alertDayInfo('+args+');"');
	res += (' <div style=color:'+solarColor+' class="'+solarClass+'">'+solarDate+'</div> <div class="'+lunarClass+'">'+lunar+'</div></td>\n');
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

function infoCellSelect(id) {
	if (id == 0) {
	}
}

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

window.onload = function(){
	//showVietCal();
	//setOutputSize("small");
	document.getElementById("content").innerHTML = printSelectedMonth();
}
