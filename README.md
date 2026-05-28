# Pomofoco

A lightweight, always-on-top Pomodoro timer for studying on Windows. Focus in blocks, take breaks, and track your progress without losing sight of the timer.

## Features

- Floating, always-on-top timer; draggable and resizable
- Color-coded phases: focus, short break, long break (configurable cycles)
- To-do style task list: click a task to start focusing on it; it auto-completes by its pomodoro estimate and moves to history
- Statistics: pomodoros and focus time per day, daily goal, streak, and a 7-day chart
- Sounds: alarms (beep / bell / digital) plus custom sounds (use your own file), volume, ticking, and ambient noise (white/brown)
- System tray icon that shows the remaining time; minimizes to tray
- Native notification and taskbar flash at the end of each phase
- Start with Windows and auto-pause when the screen is locked
- Automatic updates via GitHub Releases
- Built-in manual (the "?" button)

## Installation (Windows)

1. Download `Pomofoco Setup 1.0.0.exe` from the [Releases](../../releases) page.
2. Run it. Because the app is not code-signed yet, Windows SmartScreen may warn about an "unknown publisher" — click **More info**, then **Run anyway**.
3. The installer creates Start Menu and Desktop shortcuts and an uninstaller.

Requires Windows 10 or 11 (64-bit).

## Usage

- Play/Pause, reset, and skip with the on-screen buttons.
- Keyboard: `Space` = start/pause, `R` = reset.
- Title-bar icons: tasks, statistics, settings, pin-on-top, minimize-to-tray, and manual.

## Building from source

```bash
npm install
npm start        # run the app in dev mode
npm run dist     # build the Windows installer (NSIS) into dist/
```

**Build note (Windows without admin):** electron-builder may fail while extracting the macOS symlinks bundled in the `winCodeSign` package. Workarounds: enable **Windows Developer Mode**, or run the build once **as Administrator** (winCodeSign is then cached and later builds work normally). Builds on GitHub Actions are not affected, since the runners have the required privileges.

## Tech

Built with [Electron](https://www.electronjs.org/). No servers and no data collection — everything is stored locally on your machine.

## Support the project

Pomofoco is free and independent. If it helps your studies and you would like to say thanks, a donation via **Pix** (Brazil's instant payment system) keeps the project alive and evolving. There is no minimum amount.

Pix key (random):

```
f5d89e92-9364-4c56-93c6-d9c6d472d973
```

A **Support** button with a Pix QR code is also available inside the app, in the manual.

## License

[MIT](LICENSE) — Copyright (c) 2026 Thiago A. Quirino.

## Author

Thiago A. Quirino — thiangelio@gmail.com
