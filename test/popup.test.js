"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createPopupEnv } = require("./dom-stub.js");

test("mở popup lần đầu", async (t) => {
	await t.test("hiện lịch của tháng hôm nay", () => {
		const env = createPopupEnv();
		assert.equal(env.getMonthTitle(), "Tháng 9 2026");
		assert.equal(env.getDayCells().length, 30);
	});

	await t.test("info box mặc định là ngày hôm nay", () => {
		const env = createPopupEnv();
		assert.equal(env.getInfoText("tin-duong"), "Thứ ba, 1/9/2026");
		assert.equal(env.getInfoText("tin-am"), "Ngày 20 tháng 7 ÂL");
	});

	await t.test("info box hiện đủ 4 mục can chi / giờ đầu ngày / tiết / giờ hoàng đạo", () => {
		const env = createPopupEnv();
		assert.deepEqual(env.getInfoLabels(), ["Can chi", "Giờ đầu", "Tiết", "Giờ hoàng đạo"]);
		assert.deepEqual(env.getInfoValues().slice(0, 3), [
			"Ngày Mậu Dần, tháng Bính Thân, năm Bính Ngọ",
			"Nhâm Tý",
			"Xử thử",
		]);
	});

	await t.test("giờ hoàng đạo tách thành từng chip, không còn newline của alert cũ", () => {
		const env = createPopupEnv();
		assert.deepEqual(env.getGioChips(), [
			"Tý (23-1)",
			"Sửu (1-3)",
			"Thìn (7-9)",
			"Tỵ (9-11)",
			"Mùi (13-15)",
			"Tuất (19-21)",
		]);
		assert.doesNotMatch(env.serializeInfo(), /\n/);
	});

	await t.test("ô hôm nay được tô sẵn", () => {
		const env = createPopupEnv();
		const selected = env.getSelectedCells();
		assert.equal(selected.length, 1);
		assert.equal(env.getSolarText(selected[0]), "1");
		assert.ok(selected[0].classList.contains("homnay"));
	});

	await t.test("ngày hôm nay đổi thì lịch và info box đổi theo", () => {
		const env = createPopupEnv({ today: [2027, 1, 6] });
		assert.equal(env.getMonthTitle(), "Tháng 2 2027");
		assert.equal(env.getInfoText("tin-duong"), "Thứ bảy, 6/2/2027");
		assert.equal(env.getInfoText("tin-am"), "Ngày 1 tháng 1 ÂL");
	});
});

test("dựng DOM bằng API chuẩn, không dùng chuỗi HTML", async (t) => {
	await t.test("không còn link điều hướng mang url param", () => {
		const env = createPopupEnv();
		const html = env.serializeContent();
		assert.doesNotMatch(html, /href=/);
		assert.doesNotMatch(html, /\?yy=|\?mm=/);
		assert.equal(env.content.querySelectorAll("a").length, 0);
	});

	await t.test("điều hướng là 4 button thật với nhãn text thô", () => {
		const env = createPopupEnv();
		const buttons = env.getButtons();
		assert.equal(buttons.length, 4);
		assert.deepEqual(buttons.map((b) => b.textContent), ["<<", "<", ">", ">>"]);
		assert.deepEqual(buttons.map((b) => b.type), ["button", "button", "button", "button"]);
		assert.deepEqual(buttons.map((b) => b.dataset.action), [
			"prev-year",
			"prev-month",
			"next-month",
			"next-year",
		]);
	});

	await t.test("không còn entity HTML nào bị nhét vào text", () => {
		const env = createPopupEnv();
		assert.doesNotMatch(env.serializeContent(), /&lt;|&gt;|&nbsp;|&#x/);
	});

	await t.test("ô đệm đầu/cuối tháng không nhận click", () => {
		const env = createPopupEnv();
		const padding = env.content
			.querySelectorAll("td")
			.filter((cell) => cell.classList.contains("ngaythang") && !cell.dataset.action);
		assert.ok(padding.length > 0);
		assert.ok(padding.every((cell) => cell.children.length === 0));
	});

	await t.test("mỗi ô ngày có tooltip can chi", () => {
		const env = createPopupEnv();
		assert.ok(env.getDayCells().every((cell) => cell.title.length > 0));
	});
});

test("điều hướng tháng và năm", async (t) => {
	await t.test("bấm next-month đi tới và vượt qua mốc cuối năm", () => {
		const env = createPopupEnv();
		for (const expected of ["Tháng 10 2026", "Tháng 11 2026", "Tháng 12 2026", "Tháng 1 2027"]) {
			env.clickAction("next-month");
			assert.equal(env.getMonthTitle(), expected);
		}
	});

	await t.test("bấm prev-month lùi lại và vượt qua mốc đầu năm", () => {
		const env = createPopupEnv();
		for (const expected of ["Tháng 8 2026", "Tháng 7 2026"]) {
			env.clickAction("prev-month");
			assert.equal(env.getMonthTitle(), expected);
		}
		assert.ok(env.goToMonth(1, 2026));
		env.clickAction("prev-month");
		assert.equal(env.getMonthTitle(), "Tháng 12 2025");
	});

	await t.test("bấm next-year / prev-year giữ nguyên tháng", () => {
		const env = createPopupEnv();
		env.clickAction("next-year");
		assert.equal(env.getMonthTitle(), "Tháng 9 2027");
		env.clickAction("prev-year");
		env.clickAction("prev-year");
		assert.equal(env.getMonthTitle(), "Tháng 9 2025");
	});

	await t.test("mọi tháng đều render đủ ngày, không thiếu không lặp", () => {
		const env = createPopupEnv();
		for (const [mm, yy] of [[2, 2026], [8, 2026], [5, 2027], [1, 2027], [2, 2028]]) {
			assert.ok(env.goToMonth(mm, yy), `không tới được ${mm}/${yy}`);
			const ndays = new Date(yy, mm, 0).getDate();
			const solarDays = env.getDayCells().map((cell) => Number(env.getSolarText(cell)));
			assert.deepEqual(
				solarDays.slice().sort((a, b) => a - b),
				Array.from({ length: ndays }, (_, index) => index + 1),
				`${mm}/${yy} render sai tập ngày`
			);
		}
	});

	await t.test("mọi tháng đều cố định 5 hàng tuần", () => {
		const env = createPopupEnv();
		for (const [mm, yy] of [[2, 2026], [2, 2015], [8, 2026], [1, 2027], [5, 2027]]) {
			assert.ok(env.goToMonth(mm, yy), `không tới được ${mm}/${yy}`);
			assert.equal(env.content.querySelectorAll("tr").length - 2, 5, `${mm}/${yy} sai số hàng`);
		}
	});

	await t.test("tháng cần 6 tuần thì tuần cuối gối lên ô đệm đầu, đúng cột thứ", () => {
		const env = createPopupEnv();
		const firstWeek = () => {
			const cells = env.content.querySelectorAll("tr")[2].children;
			return [0, 1, 2, 3, 4, 5, 6].map((slot) =>
				cells[slot].dataset.action ? env.getSolarText(cells[slot]) : null
			);
		};
		assert.ok(env.goToMonth(1, 2027));
		assert.deepEqual(firstWeek(), ["31", null, null, null, null, "1", "2"]);
		assert.ok(env.goToMonth(5, 2027));
		assert.deepEqual(firstWeek(), ["30", "31", null, null, null, null, "1"]);
		assert.ok(env.goToMonth(9, 2026));
		assert.deepEqual(firstWeek(), [null, null, "1", "2", "3", "4", "5"]);
	});
});

test("giới hạn dữ liệu 1800–2199 của amlich.js", async (t) => {
	await t.test("tới 1800 thì prev-year bị vô hiệu hoá", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(9, 1800));
		assert.equal(env.getButton("prev-year").disabled, true);
		assert.equal(env.clickAction("prev-year"), false);
		assert.equal(env.getMonthTitle(), "Tháng 9 1800");
	});

	await t.test("tới 2199 thì next-year bị vô hiệu hoá", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(9, 2199));
		assert.equal(env.getButton("next-year").disabled, true);
		assert.equal(env.clickAction("next-year"), false);
		assert.equal(env.getMonthTitle(), "Tháng 9 2199");
	});

	await t.test("prev-month chỉ bị vô hiệu hoá ở đúng tháng 1/1800", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(2, 1800));
		assert.equal(env.getButton("prev-month").disabled, false);
		env.clickAction("prev-month");
		assert.equal(env.getMonthTitle(), "Tháng 1 1800");
		assert.equal(env.getButton("prev-month").disabled, true);
	});

	await t.test("next-month chỉ bị vô hiệu hoá ở đúng tháng 12/2199", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(11, 2199));
		assert.equal(env.getButton("next-month").disabled, false);
		env.clickAction("next-month");
		assert.equal(env.getMonthTitle(), "Tháng 12 2199");
		assert.equal(env.getButton("next-month").disabled, true);
	});

	await t.test("lịch ở hai đầu biên vẫn có dữ liệu âm lịch thật", () => {
		const env = createPopupEnv();
		for (const [mm, yy] of [[1, 1800], [12, 2199]]) {
			assert.ok(env.goToMonth(mm, yy));
			const cells = env.getDayCells();
			assert.ok(cells.length > 27);
			assert.ok(cells.every((cell) => env.getLunarText(cell).length > 0));
			assert.doesNotMatch(env.serializeContent(), /undefined|NaN/);
		}
	});
});

test("chọn ngày", async (t) => {
	await t.test("click một ngày thì info box đổi theo ngày đó", () => {
		const env = createPopupEnv();
		env.clickDay(12);
		assert.equal(env.getInfoText("tin-duong"), "Thứ bảy, 12/9/2026");
		assert.equal(env.getInfoText("tin-am"), "Ngày 2 tháng 8 ÂL");
		assert.equal(env.getInfoValues()[2], "Bạch lộ");
	});

	await t.test("không dùng alert nữa", () => {
		const env = createPopupEnv();
		env.clickDay(12);
		env.clickDay(20);
		assert.deepEqual(env.alerts, []);
	});

	await t.test("click vào div bên trong ô vẫn tính là click ô", () => {
		const env = createPopupEnv();
		const cell = env.getDayCells()[14];
		env.clickNode(cell.children[0]);
		assert.equal(env.getInfoText("tin-duong"), "Thứ ba, 15/9/2026");
	});

	await t.test("chỉ một ô được tô tại một thời điểm", () => {
		const env = createPopupEnv();
		env.clickDay(3);
		assert.equal(env.getSelectedCells().length, 1);
		env.clickDay(9);
		const selected = env.getSelectedCells();
		assert.equal(selected.length, 1);
		assert.equal(env.getSolarText(selected[0]), "9");
	});

	await t.test("đổi tháng thì info box giữ nguyên, chỉ mất phần tô", () => {
		const env = createPopupEnv();
		env.clickDay(15);
		env.clickAction("next-month");
		assert.equal(env.getMonthTitle(), "Tháng 10 2026");
		assert.equal(env.getInfoText("tin-duong"), "Thứ ba, 15/9/2026");
		assert.equal(env.getSelectedCells().length, 0);
	});

	await t.test("quay lại tháng cũ thì ô đang chọn được tô lại", () => {
		const env = createPopupEnv();
		env.clickDay(15);
		env.clickAction("next-month");
		env.clickAction("prev-month");
		const selected = env.getSelectedCells();
		assert.equal(selected.length, 1);
		assert.equal(env.getSolarText(selected[0]), "15");
	});
});

test("màu theo thứ và ngày đặc biệt", async (t) => {
	await t.test("chủ nhật màu đỏ, thứ bảy màu xanh, ngày thường màu đen", () => {
		const env = createPopupEnv();
		const byDay = (solarDay) => env.getDayCells().find((c) => env.getSolarText(c) === String(solarDay));
		assert.equal(byDay(6).children[0].className, "cn");
		assert.equal(byDay(5).children[0].className, "t7");
		assert.equal(byDay(7).children[0].className, "t2t6");
	});

	await t.test("info box tô màu tên thứ cho cuối tuần", () => {
		const env = createPopupEnv();
		env.clickDay(6);
		assert.equal(env.dayinfo.querySelector(".tin-duong").className, "tin-duong tin-cn");
		env.clickDay(5);
		assert.equal(env.dayinfo.querySelector(".tin-duong").className, "tin-duong tin-t7");
		env.clickDay(7);
		assert.equal(env.dayinfo.querySelector(".tin-duong").className, "tin-duong");
	});

	await t.test("mọi ngày lễ đều được tô màu Tết trên lưới", () => {
		const env = createPopupEnv();
		const peachDays = () => env.content.querySelectorAll(".tet").map((c) => env.getSolarText(c));

		assert.ok(env.goToMonth(2, 2027));
		assert.deepEqual(peachDays(), ["6", "7", "8", "14", "20"]);

		assert.ok(env.goToMonth(4, 2026));
		assert.deepEqual(peachDays(), ["19", "26", "30"]);
	});

	await t.test("mùng 1 Tết hiện đúng ngày âm 1/1 trong ô được tô", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(2, 2027));
		const tet = env.content.querySelectorAll(".tet")[0];
		assert.equal(env.getSolarText(tet), "6");
		assert.equal(env.getLunarText(tet), "1/1");
	});

	await t.test("ngày thường không bị tô màu lễ", () => {
		const env = createPopupEnv();
		const peach = env.content.querySelectorAll(".tet").map((c) => env.getSolarText(c));
		assert.deepEqual(peach, ["2", "25"]);
		const ordinary = env.getDayCells().find((c) => env.getSolarText(c) === "3");
		assert.ok(ordinary.classList.contains("ngaythang"));
	});

	await t.test("ngày trong tháng nhuận được ghi rõ là nhuận", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(7, 2025));
		const leapCell = env.getDayCells().find((cell) => cell.children[1].className === "am2");
		assert.ok(leapCell);
		env.clickNode(leapCell);
		assert.equal(env.getInfoText("tin-am"), "Ngày 1 tháng 6 nhuận ÂL");
		assert.equal(env.dayinfo.querySelector(".tin-am").className, "tin-am tin-nhuan");
	});

	await t.test("mùng 1 âm lịch hiện kèm số tháng", () => {
		const env = createPopupEnv();
		const firstOfLunarMonth = env.getDayCells().find((cell) => env.getLunarText(cell).includes("/"));
		assert.match(env.getLunarText(firstOfLunarMonth), /^\d+\/\d+$/);
	});
});

test("ngày lễ đặc biệt", async (t) => {
	await t.test("mùng 1 Tết hiện dòng Tết Nguyên Đán", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(2, 2027));
		env.clickDay(6);
		assert.equal(env.getInfoText("tin-le"), "Tết Nguyên Đán");
	});

	await t.test("rằm tháng 8 hiện Tết Trung Thu", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(9, 2027));
		env.clickDay(15);
		assert.equal(env.getInfoText("tin-le"), "Tết Trung Thu");
	});

	await t.test("lễ dương lịch cũng được nhận ra", () => {
		const env = createPopupEnv();
		env.clickDay(2);
		assert.equal(env.getInfoText("tin-le"), "Quốc khánh");
	});

	await t.test("ngày trùng cả lễ âm và lễ dương thì hiện cả hai", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(9, 2020));
		env.clickDay(2);
		assert.equal(env.getInfoText("tin-le"), "Lễ Vu Lan báo hiếu · Quốc khánh");
	});

	await t.test("ngày trong tháng nhuận không tính là lễ âm", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(6, 2028));
		const cell = env.clickDay(27);
		assert.equal(env.getLunarText(cell), "5");
		assert.equal(cell.children[1].className, "am2");
		assert.equal(env.getInfoText("tin-le"), null);
	});

	await t.test("ngày thường không có dòng lễ", () => {
		const env = createPopupEnv();
		env.clickDay(3);
		assert.equal(env.getInfoText("tin-le"), null);
	});

	await t.test("tag lễ nằm cùng hàng với ngày, là phần tử cuối của hàng đó", () => {
		const env = createPopupEnv();
		env.clickDay(2);
		const head = env.dayinfo.querySelector(".tin-dau");
		assert.deepEqual(head.children.map((c) => c.className), ["tin-ngay", "tin-le"]);
	});

	await t.test("hai dòng ngày được bọc trong .tin-ngay để tag lễ đứng cạnh", () => {
		const env = createPopupEnv();
		env.clickDay(2);
		const dates = env.dayinfo.querySelector(".tin-ngay");
		assert.deepEqual(dates.children.map((c) => c.className), ["tin-duong", "tin-am"]);
	});

	await t.test("ngày không lễ thì hàng đầu chỉ có khối ngày", () => {
		const env = createPopupEnv();
		env.clickDay(3);
		const head = env.dayinfo.querySelector(".tin-dau");
		assert.deepEqual(head.children.map((c) => c.className), ["tin-ngay"]);
	});
});

test("info box giữ cấu trúc ổn định để không nhảy chiều cao", async (t) => {
	// tháng nhuận thêm class "tin-nhuan", nên chỉ so class đầu
	const titleShape = (env) => env.dayinfo
		.querySelector(".tin-ngay")
		.children.map((c) => c.className.split(" ")[0]);

	await t.test("khối ngày luôn đúng 2 dòng, dù ngày thường, ngày lễ hay tháng nhuận", () => {
		const env = createPopupEnv();
		env.clickDay(3);
		assert.deepEqual(titleShape(env), ["tin-duong", "tin-am"]);
		env.clickDay(2);
		assert.deepEqual(titleShape(env), ["tin-duong", "tin-am"]);
		assert.ok(env.goToMonth(7, 2025));
		const leap = env.getDayCells().find((c) => c.children[1].className === "am2");
		env.clickNode(leap);
		assert.deepEqual(titleShape(env), ["tin-duong", "tin-am"]);
	});

	await t.test("hàng đầu nhiều nhất 2 phần tử: khối ngày và tag lễ", () => {
		const env = createPopupEnv();
		for (const day of [1, 2, 3, 25]) {
			env.clickDay(day);
			const head = env.dayinfo.querySelector(".tin-dau").children;
			assert.ok(head.length <= 2, `ngày ${day} có ${head.length} phần tử`);
			assert.equal(head[0].className, "tin-ngay");
		}
	});

	await t.test("dòng âm lịch dùng ÂL, không kèm can chi năm", () => {
		const env = createPopupEnv();
		for (const day of [1, 15, 30]) {
			env.clickDay(day);
			const text = env.getInfoText("tin-am");
			assert.match(text, / ÂL$/);
			assert.doesNotMatch(text, /âm lịch|năm /);
		}
	});

	await t.test("can chi giữ dạng đầy đủ và không kèm dấu nhuận", () => {
		const env = createPopupEnv();
		for (const day of [1, 15, 30]) {
			env.clickDay(day);
			assert.match(env.getInfoValues()[0], /^Ngày .+, tháng .+, năm .+$/);
		}
		assert.ok(env.goToMonth(7, 2025));
		env.clickNode(env.getDayCells().find((c) => c.children[1].className === "am2"));
		assert.doesNotMatch(env.getInfoValues()[0], /nhuận/);
	});

	await t.test("tooltip ô lịch vẫn đánh dấu tháng nhuận", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(7, 2025));
		const leap = env.getDayCells().find((c) => c.children[1].className === "am2");
		assert.match(leap.title, /^Ngày .+, tháng .+ \(nhuận\), năm .+$/);
		assert.doesNotMatch(env.getDayCells()[0].title, /nhuận/);
	});

	await t.test("giờ hoàng đạo luôn đúng 6 mục", () => {
		const env = createPopupEnv();
		for (const day of [1, 7, 14, 21, 28]) {
			env.clickDay(day);
			assert.equal(env.getGioChips().length, 6);
		}
	});

	await t.test("nhãn đã rút ngắn theo đúng yêu cầu", () => {
		const env = createPopupEnv();
		assert.deepEqual(env.getInfoLabels(), ["Can chi", "Giờ đầu", "Tiết", "Giờ hoàng đạo"]);
	});

	await t.test("tên lễ 30/4 đã rút ngắn", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(4, 2026));
		env.clickDay(30);
		assert.equal(env.getInfoText("tin-le"), "Giải phóng miền Nam");
	});
});

test("các hành động còn lại", async (t) => {
	await t.test("click hàng thứ hiện thông tin về extension", () => {
		const env = createPopupEnv();
		env.clickNode(env.content.querySelector('tr[data-action="about"]'));
		assert.equal(env.alerts.length, 1);
		assert.match(env.alerts[0], /Âm lịch Việt Nam/);
	});

	await t.test("click chỗ trống không làm gì cả", () => {
		const env = createPopupEnv();
		const before = env.serializeContent();
		env.clickNode(env.content.querySelector(".ngaytuan").parentNode.parentNode);
		assert.equal(env.serializeContent(), before);
		assert.deepEqual(env.alerts, []);
	});
});

test("title tách thành phần tháng và phần năm", async (t) => {
	await t.test("hiện hai nhãn riêng, không còn dạng 9/2026", () => {
		const env = createPopupEnv();
		assert.equal(env.getMonthLabel(), "Tháng 9");
		assert.equal(env.getYearLabel(), "2026");
		assert.doesNotMatch(env.content.querySelector(".tenthang").className, /chon/);
	});

	await t.test("mỗi phần là một vùng click riêng", () => {
		const env = createPopupEnv();
		assert.equal(env.content.querySelector(".tenthang-thang").dataset.action, "open-month-picker");
		assert.equal(env.content.querySelector(".tenthang-nam").dataset.action, "open-year-picker");
		assert.equal(env.content.querySelector(".tenthang").dataset.action, undefined);
	});

	await t.test("không còn mở trang ngoài hay gọi print như bản cũ", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		env.clickPickerCell("Tháng 3");
		env.openYearPicker();
		env.clickPickerCell(2030);
		assert.deepEqual(env.openedWindows, []);
		assert.equal(env.getPrintCalls(), 0);
	});
});

test("dialog chọn tháng", async (t) => {
	await t.test("click phần tháng mở dialog lưới 4 cột 12 tháng", () => {
		const env = createPopupEnv();
		assert.equal(env.isPickerOpen(), false);
		env.openMonthPicker();
		assert.equal(env.isPickerOpen(), true);
		assert.equal(env.getPickerGridClass(), "hop-luoi luoi-thang");
		assert.deepEqual(
			env.getPickerCells().map((c) => c.label),
			["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
				"Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]
		);
	});

	await t.test("tiêu đề dialog nói rõ đang chọn tháng của năm nào", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		assert.equal(env.getPickerTitle(), "Chọn tháng năm 2026");
		env.clickPickerCell("Tháng 4");
		env.clickAction("next-year");
		env.openMonthPicker();
		assert.equal(env.getPickerTitle(), "Chọn tháng năm 2027");
	});

	await t.test("tháng đang xem được tô, và chỉ một tháng", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		assert.deepEqual(env.getPickerCells().filter((c) => c.current).map((c) => c.label), ["Tháng 9"]);
	});

	await t.test("chọn tháng thì lịch nhảy tới và dialog đóng", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		assert.equal(env.clickPickerCell("Tháng 12"), true);
		assert.equal(env.getMonthTitle(), "Tháng 12 2026");
		assert.equal(env.isPickerOpen(), false);
	});

	await t.test("chọn tháng giữ nguyên năm đang xem", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(3, 2028));
		env.openMonthPicker();
		env.clickPickerCell("Tháng 11");
		assert.equal(env.getMonthTitle(), "Tháng 11 2028");
	});

	await t.test("không tháng nào bị vô hiệu hoá", () => {
		const env = createPopupEnv();
		for (const [mm, yy] of [[1, 1800], [12, 2199]]) {
			assert.ok(env.goToMonth(mm, yy));
			env.openMonthPicker();
			assert.deepEqual(env.getPickerCells().filter((c) => c.disabled), []);
			env.pressKey("Escape");
		}
	});
});

test("dialog chọn năm", async (t) => {
	await t.test("click phần năm mở dialog lưới 3x3 với năm đang xem ở giữa", () => {
		const env = createPopupEnv();
		env.openYearPicker();
		assert.equal(env.getPickerGridClass(), "hop-luoi luoi-nam");
		const cells = env.getPickerCells();
		assert.deepEqual(cells.map((c) => c.label), ["2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"]);
		assert.equal(cells[4].label, "2026");
		assert.equal(cells[4].current, true);
		assert.deepEqual(cells.filter((c) => c.current).map((c) => c.label), ["2026"]);
	});

	await t.test("tiêu đề dialog là khoảng năm đang hiện", () => {
		const env = createPopupEnv();
		env.openYearPicker();
		assert.equal(env.getPickerTitle(), "2022–2030");
	});

	await t.test("chọn năm thì lịch nhảy tới và dialog đóng", () => {
		const env = createPopupEnv();
		env.openYearPicker();
		assert.equal(env.clickPickerCell(2029), true);
		assert.equal(env.getMonthTitle(), "Tháng 9 2029");
		assert.equal(env.isPickerOpen(), false);
	});

	await t.test("chọn năm giữ nguyên tháng đang xem", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(2, 2026));
		env.openYearPicker();
		env.clickPickerCell(2024);
		assert.equal(env.getMonthTitle(), "Tháng 2 2024");
	});

	await t.test("nút phải lùi/tiến 9 năm một trang", () => {
		const env = createPopupEnv();
		env.openYearPicker();
		assert.equal(env.clickPickerAction("next-year-page"), true);
		assert.equal(env.getPickerTitle(), "2031–2039");
		assert.equal(env.clickPickerAction("prev-year-page"), true);
		assert.equal(env.clickPickerAction("prev-year-page"), true);
		assert.equal(env.getPickerTitle(), "2013–2021");
	});

	await t.test("phân trang không đổi lịch, chỉ đổi lưới năm", () => {
		const env = createPopupEnv();
		env.openYearPicker();
		env.clickPickerAction("next-year-page");
		assert.equal(env.getMonthTitle(), "Tháng 9 2026");
		assert.equal(env.isPickerOpen(), true);
		assert.deepEqual(env.getPickerCells().filter((c) => c.current), []);
	});

	await t.test("năm ngoài 1800–2199 bị vô hiệu hoá nhưng lưới vẫn đủ 9 ô", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(9, 1800));
		env.openYearPicker();
		const cells = env.getPickerCells();
		assert.equal(cells.length, 9);
		assert.deepEqual(cells.filter((c) => c.disabled).map((c) => c.label), ["1796", "1797", "1798", "1799"]);
		assert.equal(env.clickPickerCell(1799), false);
		assert.equal(env.getMonthTitle(), "Tháng 9 1800");
	});

	await t.test("hết dữ liệu thì nút phân trang bị vô hiệu hoá", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(9, 1800));
		env.openYearPicker();
		assert.equal(env.getPickerButton("prev-year-page").disabled, true);
		assert.equal(env.clickPickerAction("prev-year-page"), false);
		assert.equal(env.getPickerButton("next-year-page").disabled, false);
		env.pressKey("Escape");

		assert.ok(env.goToMonth(9, 2199));
		env.openYearPicker();
		assert.equal(env.getPickerButton("next-year-page").disabled, true);
		assert.equal(env.clickPickerAction("next-year-page"), false);
		assert.equal(env.getPickerButton("prev-year-page").disabled, false);
	});

	await t.test("mở lại dialog thì trang quay về năm đang xem", () => {
		const env = createPopupEnv();
		env.openYearPicker();
		env.clickPickerAction("next-year-page");
		env.pressKey("Escape");
		env.openYearPicker();
		assert.equal(env.getPickerTitle(), "2022–2030");
	});
});

test("đóng dialog", async (t) => {
	await t.test("nút × đóng dialog", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		assert.equal(env.clickPickerAction("close-picker"), true);
		assert.equal(env.isPickerOpen(), false);
	});

	await t.test("click backdrop ngoài panel đóng dialog", () => {
		const env = createPopupEnv();
		env.openYearPicker();
		env.clickPickerBackdrop();
		assert.equal(env.isPickerOpen(), false);
	});

	await t.test("click trong panel nhưng ngoài ô không đóng dialog", () => {
		const env = createPopupEnv();
		env.openYearPicker();
		env.clickPickerNode(env.picker.querySelector(".hop-ten"));
		assert.equal(env.isPickerOpen(), true);
		env.clickPickerNode(env.picker.querySelector(".hop-luoi"));
		assert.equal(env.isPickerOpen(), true);
	});

	await t.test("Escape đóng dialog", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		env.pressKey("Escape");
		assert.equal(env.isPickerOpen(), false);
	});

	await t.test("phím khác không đóng dialog", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		env.pressKey("Enter");
		assert.equal(env.isPickerOpen(), true);
	});

	await t.test("click lại nhãn title khi dialog đang mở thì rơi vào backdrop và đóng dialog", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		env.clickPickerBackdrop();
		assert.equal(env.isPickerOpen(), false);
		env.openYearPicker();
		assert.equal(env.getPickerGridClass(), "hop-luoi luoi-nam");
	});

	await t.test("dialog không lẫn vào lịch, info box hay box lễ", () => {
		const env = createPopupEnv();
		env.openMonthPicker();
		assert.doesNotMatch(env.serializeContent(), /hop-chon|hop-o/);
		assert.doesNotMatch(env.serializeInfo(), /hop-chon/);
		assert.doesNotMatch(env.serializeHolidays(), /hop-chon/);
		assert.match(env.serializePicker(), /hop-chon/);
	});

	await t.test("đổi tháng bằng dialog vẫn giữ ô ngày đang chọn", () => {
		const env = createPopupEnv();
		env.clickDay(15);
		env.openMonthPicker();
		env.clickPickerCell("Tháng 10");
		assert.equal(env.getSelectedCells().length, 0);
		env.openMonthPicker();
		env.clickPickerCell("Tháng 9");
		assert.deepEqual(env.getSelectedCells().map((c) => env.getSolarText(c)), ["15"]);
		assert.equal(env.getInfoText("tin-duong"), "Thứ ba, 15/9/2026");
	});
});

test("box ngày lễ âm lịch sắp tới", async (t) => {
	await t.test("liệt kê 12 tháng tới, không dừng ở cuối năm dương", () => {
		const env = createPopupEnv();
		assert.equal(env.getHolidayTitle(), "Ngày lễ âm lịch sắp tới");
		assert.deepEqual(
			env.getHolidays().map((h) => h.solar + " " + h.name),
			[
				"25/9/2026 Tết Trung Thu",
				"30/1/2027 Ông Táo về trời",
				"6–8/2/2027 Tết Nguyên Đán",
				"20/2/2027 Tết Nguyên Tiêu",
				"16/4/2027 Giỗ Tổ Hùng Vương",
				"9/6/2027 Tết Đoan Ngọ",
				"16/8/2027 Lễ Vu Lan báo hiếu",
			]
		);
	});

	await t.test("mùng 1-2-3 Tết gộp thành một dòng", () => {
		const env = createPopupEnv();
		const tet = env.getHolidays().filter((h) => h.name === "Tết Nguyên Đán");
		assert.equal(tet.length, 1);
		assert.equal(tet[0].solar, "6–8/2/2027");
		assert.equal(tet[0].lunar, "1–3/1 ÂL");
		assert.doesNotMatch(env.serializeHolidays(), /mùng 2|mùng 3/);
	});

	await t.test("chỉ mốc gần nhất có đếm ngược", () => {
		const env = createPopupEnv();
		const rows = env.getHolidays();
		assert.equal(rows[0].countdown, "còn 24 ngày");
		assert.deepEqual(rows.slice(1).map((h) => h.countdown), new Array(rows.length - 1).fill(null));
	});

	await t.test("lễ hôm nay vẫn còn trong danh sách và ghi hôm nay", () => {
		const env = createPopupEnv({ today: [2026, 8, 25] });
		const rows = env.getHolidays();
		assert.equal(rows[0].name, "Tết Trung Thu");
		assert.equal(rows[0].solar, "25/9/2026");
		assert.equal(rows[0].countdown, "hôm nay");
	});

	await t.test("lễ hôm qua đã bị loại khỏi danh sách", () => {
		const env = createPopupEnv({ today: [2026, 8, 26] });
		assert.equal(env.getHolidays().some((h) => h.name === "Tết Trung Thu"), false);
	});

	await t.test("đứng giữa Tết thì mùng còn lại vẫn mang nhãn Tết Nguyên Đán", () => {
		const env = createPopupEnv({ today: [2027, 1, 7] });
		const tet = env.getHolidays().filter((h) => h.name === "Tết Nguyên Đán");
		// Cửa sổ 12 tháng từ 7/2/2027 chạm cả Tết 2028, nên có 2 dòng Tết
		assert.equal(tet.length, 2);
		assert.equal(tet[0].solar, "7–8/2/2027");
		assert.equal(tet[0].lunar, "2–3/1 ÂL");
		assert.equal(tet[0].countdown, "hôm nay");
		assert.equal(tet[1].solar, "26–28/1/2028");
		assert.equal(tet[1].lunar, "1–3/1 ÂL");
	});

	await t.test("chỉ lấy lễ âm, không lẫn lễ dương", () => {
		const env = createPopupEnv();
		assert.doesNotMatch(env.serializeHolidays(), /Quốc khánh|Giáng sinh|Nhà giáo|Phụ nữ/);
	});

	await t.test("click một dòng thì lịch nhảy tới tháng đó và chọn đúng ngày", () => {
		const env = createPopupEnv();
		env.clickHoliday("Tết Nguyên Đán");
		assert.equal(env.getMonthTitle(), "Tháng 2 2027");
		assert.equal(env.getInfoText("tin-duong"), "Thứ bảy, 6/2/2027");
		assert.equal(env.getInfoText("tin-am"), "Ngày 1 tháng 1 ÂL");
		assert.equal(env.getInfoText("tin-le"), "Tết Nguyên Đán");
		assert.deepEqual(env.getSelectedCells().map((c) => c.children[0].textContent), ["6"]);
	});

	await t.test("box không lẫn vào info box của ngày", () => {
		const env = createPopupEnv();
		assert.doesNotMatch(env.serializeInfo(), /le-dong|le-dau/);
		assert.doesNotMatch(env.serializeHolidays(), /tin-bang|tin-dau/);
	});
});

test("in đậm hai lễ âm được nghỉ chính thức", async (t) => {
	await t.test("chỉ Tết Nguyên Đán và Giỗ Tổ Hùng Vương được in đậm", () => {
		const env = createPopupEnv();
		assert.deepEqual(
			env.getHolidays().filter((h) => h.major).map((h) => h.name),
			["Tết Nguyên Đán", "Giỗ Tổ Hùng Vương"]
		);
	});

	await t.test("các lễ âm lớn khác vẫn không đậm", () => {
		const env = createPopupEnv();
		const plain = env.getHolidays().filter((h) => !h.major).map((h) => h.name);
		assert.deepEqual(plain, [
			"Tết Trung Thu",
			"Ông Táo về trời",
			"Tết Nguyên Tiêu",
			"Tết Đoan Ngọ",
			"Lễ Vu Lan báo hiếu",
		]);
	});

	await t.test("dòng Tết gộp từ mùng 2 vẫn giữ in đậm", () => {
		const env = createPopupEnv({ today: [2027, 1, 7] });
		const tet = env.getHolidays().filter((h) => h.name === "Tết Nguyên Đán");
		assert.deepEqual(tet.map((h) => h.major), [true, true]);
	});
});

test("mỗi dòng lễ kèm thứ ngay trước ngày dương", async (t) => {
	await t.test("thứ khớp với ngày dương của từng lễ", () => {
		const env = createPopupEnv();
		assert.deepEqual(
			env.getHolidays().map((h) => h.dow + " " + h.solar),
			[
				"T6 25/9/2026",
				"T7 30/1/2027",
				"T7 6–8/2/2027",
				"T7 20/2/2027",
				"T6 16/4/2027",
				"T4 9/6/2027",
				"T2 16/8/2027",
			]
		);
	});

	await t.test("Tết gộp từ mùng 2 lấy thứ của mùng 2, không phải mùng 1", () => {
		const env = createPopupEnv({ today: [2027, 1, 7] });
		const tet = env.getHolidays().find((h) => h.name === "Tết Nguyên Đán");
		assert.equal(tet.dow + " " + tet.solar, "CN 7–8/2/2027");
	});
});

test("box chỉ hiện đúng danh sách lễ âm đã chốt", async (t) => {
	const ALLOWED = [
		"Tết Nguyên Đán",
		"Tết Nguyên Tiêu",
		"Giỗ Tổ Hùng Vương",
		"Tết Đoan Ngọ",
		"Lễ Vu Lan báo hiếu",
		"Tết Trung Thu",
		"Ông Táo về trời",
	];

	await t.test("Tết Hàn Thực và Lễ Phật Đản không xuất hiện trong box", () => {
		const env = createPopupEnv();
		assert.doesNotMatch(env.serializeHolidays(), /Hàn Thực|Phật Đản/);
		assert.equal(env.getHolidayRows().length, 7);
	});

	await t.test("không lễ nào ngoài danh sách lọt vào box, ở bất kỳ mốc nào trong năm", () => {
		for (const today of [[2026, 8, 1], [2026, 11, 31], [2027, 1, 7], [2027, 5, 30]]) {
			const env = createPopupEnv({ today });
			for (const holiday of env.getHolidays()) {
				assert.ok(ALLOWED.includes(holiday.name), holiday.name + " lọt vào box (today=" + today + ")");
			}
		}
	});

	await t.test("lễ bị ẩn khỏi box vẫn hiện ở info box và vẫn được tô trên lịch", () => {
		const env = createPopupEnv();
		for (const [mm, day, name] of [[4, 9, "Tết Hàn Thực"], [5, 20, "Lễ Phật Đản"]]) {
			assert.equal(env.goToMonth(mm, 2027), true);
			const cell = env.clickDay(day);
			assert.equal(env.getInfoText("tin-le"), name);
			assert.equal(cell.classList.contains("tet"), true);
		}
	});
});
