// ==UserScript==
// @name         Roblox Server Joiner UI
// @namespace    https://roblox.com/
// @version      1.5
// @description  Join Roblox servers using Game ID and Job ID (full or shortened/website format) with history tracking and persistence
// @author       @banana_2137 (discord) , @Banan412 (github)
// @match        https://*.roblox.com/*
// @grant        none
// ==/UserScript==

/* global Roblox */

(function () {
    'use strict';

    function createUI() {
        if (document.getElementById('serverJoinerPanel')) return;

        const panel = document.createElement('div');
        panel.id = 'serverJoinerPanel';

        panel.style.position = 'fixed';
        panel.style.top = '20px';
        panel.style.right = '20px';
        panel.style.width = '250px';
        panel.style.background = '#1f1f1f';
        panel.style.color = '#fff';
        panel.style.padding = '12px';
        panel.style.borderRadius = '8px';
        panel.style.zIndex = '999999';
        panel.style.fontFamily = 'Arial, sans-serif';
        panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        panel.innerHTML = `
            <div id="dragHandle" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;cursor:move;">
                <div style="font-size:16px;font-weight:bold;">
                    Server Joiner
                </div>

                <div>
                    <button
                        id="minimizeBtn"
                        style="background:none;border:none;color:white;cursor:pointer;font-size:16px;margin-right:5px;"
                    >−</button>

                    <button
                        id="closeBtn"
                        style="background:none;border:none;color:white;cursor:pointer;font-size:16px;"
                    >×</button>
                </div>
            </div>

            <div id="panelContent">
                <input
                    id="placeIdInput"
                    type="text"
                    placeholder="Game ID"
                    style="width:100%;margin-bottom:8px;padding:6px;box-sizing:border-box;"
                >

                <input
                    id="jobIdInput"
                    type="text"
                    placeholder="Job ID"
                    style="width:100%;margin-bottom:8px;padding:6px;box-sizing:border-box;"
                >

                <button
                    id="joinServerBtn"
                    style="width:100%;padding:8px;cursor:pointer;"
                >
                    Join
                </button>

                <div
                    id="joinStatus"
                    style="margin-top:8px;font-size:12px;"
                ></div>
            </div>
        `;

        document.body.appendChild(panel);

        const placeIdInput = document.getElementById('placeIdInput');
        const jobIdInput = document.getElementById('jobIdInput');

        // Load saved values from localStorage
        try {
            placeIdInput.value = localStorage.getItem('serverJoiner_placeId') || '';
            jobIdInput.value = localStorage.getItem('serverJoiner_jobId') || '';
        } catch (e) {
            console.error('Could not access localStorage:', e);
        }

        // Save inputs on type
        placeIdInput.addEventListener('input', () => {
            try {
                localStorage.setItem('serverJoiner_placeId', placeIdInput.value.trim());
            } catch (e) {}
        });

        jobIdInput.addEventListener('input', () => {
            try {
                localStorage.setItem('serverJoiner_jobId', jobIdInput.value.trim());
            } catch (e) {}
        });

        // Dragging
        const dragHandle = document.getElementById('dragHandle');

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;

            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
            panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Minimize / Close
        const minimizeBtn = document.getElementById('minimizeBtn');
        const closeBtn = document.getElementById('closeBtn');
        const panelContent = document.getElementById('panelContent');

        let minimized = false;

        minimizeBtn.addEventListener('click', () => {
            minimized = !minimized;

            if (minimized) {
                panelContent.style.display = 'none';
                minimizeBtn.textContent = '+';
            } else {
                panelContent.style.display = 'block';
                minimizeBtn.textContent = '−';
            }
        });

        closeBtn.addEventListener('click', () => {
            panel.remove();
        });

        // Join button
        document.getElementById('joinServerBtn').addEventListener('click', async () => {
            const placeId = placeIdInput.value.trim();
            const jobId = jobIdInput.value.trim();
            const status = document.getElementById('joinStatus');

            if (!placeId) {
                status.textContent = 'Please enter a Game ID.';
                return;
            }

            try {
                if (!window.Roblox || !Roblox.GameLauncher) {
                    status.textContent = 'Roblox.GameLauncher not found.';
                    console.log('window.Roblox =', window.Roblox);
                    return;
                }

                if (jobId) {
                    let targetJobId = jobId;

                    // Standard UUID length is 32 alphanumeric characters.
                    // If the cleaned input is shorter than 32, resolve it from the public server list.
                    const normalizedInput = jobId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                    if (normalizedInput.length === 0) {
                        throw new Error('Please enter a valid Job ID.');
                    }

                    if (normalizedInput.length < 32) {
                        status.textContent = 'Resolving shortened Job ID...';

                        let nextPageCursor = '';
                        let matchedServer = null;
                        let pagesScanned = 0;

                        // Scan up to 3 pages (up to 300 servers) to find the match
                        while (!matchedServer && pagesScanned < 50) {
                            const cursorParam = nextPageCursor ? `&cursor=${nextPageCursor}` : '';
                            const response = await fetch(`https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100${cursorParam}`);
                            
                            if (!response.ok) {
                                throw new Error(`Failed to contact servers API (Status: ${response.status})`);
                            }

                            const result = await response.json();
                            if (!result.data || result.data.length === 0) {
                                break;
                            }

                            // Clean both IDs of hyphens/punctuation for a reliable match
                            matchedServer = result.data.find(srv => {
                                const normalizedServerId = srv.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                                return normalizedServerId.includes(normalizedInput);
                            });

                            if (matchedServer) break;

                            nextPageCursor = result.nextPageCursor;
                            if (!nextPageCursor) break;
                            pagesScanned++;
                        }

                        if (!matchedServer) {
                            throw new Error(`Could not find an active server matching "${jobId}".`);
                        }

                        targetJobId = matchedServer.id;
                        status.textContent = `Resolved Job ID: ${targetJobId.substring(0, 8)}...`;
                    }

                    status.textContent = 'Attempting to join specific server...';
                    Roblox.GameLauncher.joinGameInstance(placeId, targetJobId);
                } else {
                    status.textContent = 'Finding a random public server...';

                    // Fetch up to 100 public servers
                    const response = await fetch(`https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100`);
                    if (!response.ok) {
                        throw new Error(`Failed to contact servers API (Status: ${response.status})`);
                    }

                    const result = await response.json();
                    if (!result.data || result.data.length === 0) {
                        status.textContent = 'No active servers found. Joining standard matchmaking...';
                        Roblox.GameLauncher.joinMultiplayerGame(placeId);
                        return;
                    }

                    // Retrieve history of previously joined servers
                    let joinedHistory = [];
                    try {
                        joinedHistory = JSON.parse(localStorage.getItem('serverJoiner_history')) || [];
                        if (!Array.isArray(joinedHistory)) joinedHistory = [];
                    } catch (e) {
                        joinedHistory = [];
                    }

                    // Filter out full servers
                    const joinableServers = result.data.filter(srv => srv.playing < srv.maxPlayers);

                    if (joinableServers.length === 0) {
                        status.textContent = 'All retrieved servers are full. Joining standard matchmaking...';
                        Roblox.GameLauncher.joinMultiplayerGame(placeId);
                        return;
                    }

                    // Filter out servers we already visited
                    const unvisitedServers = joinableServers.filter(srv => !joinedHistory.includes(srv.id));

                    let selectedServer;

                    if (unvisitedServers.length > 0) {
                        // Pick a random unvisited server
                        selectedServer = unvisitedServers[Math.floor(Math.random() * unvisitedServers.length)];
                    } else {
                        // All available servers have been visited. Reset history for these servers and pick one at random.
                        status.textContent = 'All available servers already visited. Resetting history...';
                        selectedServer = joinableServers[Math.floor(Math.random() * joinableServers.length)];

                        // Remove these server IDs from the persistent history
                        joinedHistory = joinedHistory.filter(id => !joinableServers.some(srv => srv.id === id));
                    }

                    // Add current server to history (limit history size to last 50 entries)
                    joinedHistory.push(selectedServer.id);
                    if (joinedHistory.length > 50) {
                        joinedHistory.shift();
                    }

                    try {
                        localStorage.setItem('serverJoiner_history', JSON.stringify(joinedHistory));
                    } catch (e) {}

                    status.textContent = `Joining random server: ${selectedServer.id} (${selectedServer.playing}/${selectedServer.maxPlayers})...`;
                    Roblox.GameLauncher.joinGameInstance(placeId, selectedServer.id);
                }
            } catch (err) {
                console.error(err);
                status.textContent = 'Error: ' + err.message;
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();
