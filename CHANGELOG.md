# Changelog

## [Next]

### Added

- Box "Ngày lễ sắp tới": bấm một dòng để lịch nhảy tới tháng chứa ngày đó.

### Changed

- Popup thiết kế lại.

### Development

- Thay Closure Compiler bằng terser, tách `src/`, thêm test suite và CI.

## [0.4.0] - 2026-09-01

### Changed

- Nâng lên Manifest V3 để tương thích với Chrome hiện tại: background chuyển sang service worker,
  `chrome.browserAction` thành `chrome.action`.

### Fixed

- Icon trên thanh công cụ làm mới bằng `chrome.alarms` thay vì `setTimeout`, nên không còn đứng lại
  khi Chrome tạm dừng service worker.

## [0.3.2] - 2013-10-24

### Changed

- Tăng version để đẩy bản sửa lỗi của 0.3.1 lên Web Store; không đổi code.

## [0.3.1] - 2013-10-22

### Added

- Tooltip can chi khi trỏ vào icon trên thanh công cụ.

### Fixed

- Icon chỉ làm mới một lần rồi dừng, do `setTimeout` nằm ngoài hàm làm mới nên không hẹn lại.

## [0.3] - 2013-10-22

### Added

- Icon trên thanh công cụ hiển thị số ngày âm hiện tại.

## [0.2] - 2013-10-08

### Added

- Phiên bản đầu tiên: popup lịch tháng với ngày dương và ngày âm.
