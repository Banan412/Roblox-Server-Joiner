# Roblox Server Joiner UI

A simple and lightweight userscript for Roblox that adds a draggable server joiner panel directly to the Roblox website. It allows quick joining of games and specific server instances using Place ID and Job ID.

---

## Features

- **Join by Game ID:** Connect to any game using only a Game ID (Place ID).
- **Smart Random Hopping:** If the Job ID field is left blank, the script fetches the active public server list, filters out full servers, and connects you to a random server to avoid putting you back in the same server you just left.
- **Server Visit History:** Tracks the last 50 servers you have joined. When random hopping, the script prioritizes unvisited servers. If you have visited all available non-full servers, the history resets automatically.
- **Shortened Job ID Support:** Works with both full 36-character Job IDs and shortened formats (such as the split `ba7e-6afc` format used by BTRoblox/Website list IDs). It scans up to 1000 active servers to resolve and match the shortened ID.
- **Input Persistence:** Automatically saves your last entered Game ID and Job ID using `localStorage` so they are not cleared when you refresh the page.
- **Draggable UI Window:** Position the UI panel anywhere on your screen.
- **Minimize & Restore:** Collapse the panel to keep your screen clean, or close it entirely.
- **Lightweight:** Runs directly on roblox.com via standard browser extensions.

---

## How It Works

This script injects a custom interface into Roblox pages and relies on standard browser APIs alongside Roblox’s built-in client launcher functions:

- It saves inputs and history using browser `localStorage`.
- It fetches public active servers via the `games.roblox.com` Web API to resolve shortened IDs and find random empty servers.
- It triggers connections using the Roblox launcher protocol:
  - `Roblox.GameLauncher.joinMultiplayerGame(placeId)`
  - `Roblox.GameLauncher.joinGameInstance(placeId, jobId)`

<img width="309" height="238" alt="image" src="https://github.com/user-attachments/assets/f2a4c6ce-1e78-4b21-b0f4-fbd7edfb96cb" />

---

## Installation

### 1. Install a Userscript Manager

You need to install a userscript manager extension for your web browser:

- [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
- [Violentmonkey](https://violentmonkey.github.io/) (Alternative)

### 2. Add the Script

1. Open your userscript manager dashboard.
2. Create a new script.
3. Paste the full code of the userscript into the editor.
4. Save the script.
5. Open any Roblox page (or refresh if already open).

---

## Usage

1. Open any Roblox page.
2. The **Server Joiner** panel will appear near the top-right corner of the screen.
3. Enter the target **Game ID** (Place ID).
4. Enter the **Job ID** (Optional):
   - **Leave Blank:** Finds a random, non-full, unvisited active server.
   - **Enter Job ID:** Accepts full 36-character IDs or shortened formats (e.g., `ba7e-6afc`).
5. Click **Join**.

---

## Notes

- Changes to Roblox's website, API endpoints, or client launcher behavior may affect or break functionality.
- Direct joining depends on server permissions and may fail if the server is private or restricted.
- Requires you to be logged into a valid Roblox account on the web version.

---

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Roblox Corporation. 

---

## Authors

- [@banana_2137](https://discord.com) (Discord)
- [@Banan412](https://github.com/Banan412) (GitHub)

---

## License

MIT License
