"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createPopupEnv } = require("./dom-stub.js");

test("mở popup lần đầu", async (t) => {
	await t.test("hiện lịch của tháng hôm nay", () => {
		const env = createPopupEnv();
		assert.equal(env.getMonthTitle(), "9/2026");
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
		assert.equal(env.getMonthTitle(), "2/2027");
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
		for (const expected of ["10/2026", "11/2026", "12/2026", "1/2027"]) {
			env.clickAction("next-month");
			assert.equal(env.getMonthTitle(), expected);
		}
	});

	await t.test("bấm prev-month lùi lại và vượt qua mốc đầu năm", () => {
		const env = createPopupEnv();
		for (const expected of ["8/2026", "7/2026"]) {
			env.clickAction("prev-month");
			assert.equal(env.getMonthTitle(), expected);
		}
		assert.ok(env.goToMonth(1, 2026));
		env.clickAction("prev-month");
		assert.equal(env.getMonthTitle(), "12/2025");
	});

	await t.test("bấm next-year / prev-year giữ nguyên tháng", () => {
		const env = createPopupEnv();
		env.clickAction("next-year");
		assert.equal(env.getMonthTitle(), "9/2027");
		env.clickAction("prev-year");
		env.clickAction("prev-year");
		assert.equal(env.getMonthTitle(), "9/2025");
	});

	await t.test("mọi tháng đều render đủ ngày, liên tục từ 1", () => {
		const env = createPopupEnv();
		for (const [mm, yy] of [[2, 2026], [8, 2026], [5, 2027], [1, 2027], [2, 2028]]) {
			assert.ok(env.goToMonth(mm, yy), `không tới được ${mm}/${yy}`);
			const solarDays = env.getDayCells().map((cell) => Number(env.getSolarText(cell)));
			assert.deepEqual(solarDays, solarDays.map((_, index) => index + 1));
			assert.equal(new Date(yy, mm, 0).getDate(), solarDays.length);
		}
	});

	await t.test("tháng ngắn không sinh tuần trống ở cuối", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(2, 2026));
		const weekRows = env.content.querySelectorAll("tr").length - 2;
		assert.equal(weekRows, 4);
	});
});

test("giới hạn dữ liệu 1800–2199 của amlich.js", async (t) => {
	await t.test("tới 1800 thì prev-year bị vô hiệu hoá", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(9, 1800));
		assert.equal(env.getButton("prev-year").disabled, true);
		assert.equal(env.clickAction("prev-year"), false);
		assert.equal(env.getMonthTitle(), "9/1800");
	});

	await t.test("tới 2199 thì next-year bị vô hiệu hoá", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(9, 2199));
		assert.equal(env.getButton("next-year").disabled, true);
		assert.equal(env.clickAction("next-year"), false);
		assert.equal(env.getMonthTitle(), "9/2199");
	});

	await t.test("prev-month chỉ bị vô hiệu hoá ở đúng tháng 1/1800", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(2, 1800));
		assert.equal(env.getButton("prev-month").disabled, false);
		env.clickAction("prev-month");
		assert.equal(env.getMonthTitle(), "1/1800");
		assert.equal(env.getButton("prev-month").disabled, true);
	});

	await t.test("next-month chỉ bị vô hiệu hoá ở đúng tháng 12/2199", () => {
		const env = createPopupEnv();
		assert.ok(env.goToMonth(11, 2199));
		assert.equal(env.getButton("next-month").disabled, false);
		env.clickAction("next-month");
		assert.equal(env.getMonthTitle(), "12/2199");
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
		assert.equal(env.getMonthTitle(), "10/2026");
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

	await t.test("click tên tháng mở trang gốc của tác giả", () => {
		const env = createPopupEnv();
		env.clickNode(env.content.querySelector(".tenthang"));
		assert.equal(env.openedWindows.length, 1);
		assert.match(env.openedWindows[0], /amlich/);
	});

	await t.test("click vào chỗ trống không làm gì cả", () => {
		const env = createPopupEnv();
		const before = env.serializeContent();
		env.clickNode(env.content.querySelector(".ngaytuan").parentNode.parentNode);
		assert.equal(env.serializeContent(), before);
		assert.deepEqual(env.alerts, []);
	});
});
