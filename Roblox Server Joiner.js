// ==UserScript==
// @name         Roblox Server Joiner UI
// @namespace    https://roblox.com/
// @version      1.2
// @description  Join Roblox servers using Game ID and Job ID with input persistence and random server hopping
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
                    status.textContent = 'Attempting to join specific server...';
                    Roblox.GameLauncher.joinGameInstance(placeId, jobId);
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

                    // Filter out full servers
                    const joinableServers = result.data.filter(srv => srv.playing < srv.maxPlayers);

                    if (joinableServers.length === 0) {
                        status.textContent = 'All retrieved servers are full. Joining standard matchmaking...';
                        Roblox.GameLauncher.joinMultiplayerGame(placeId);
                        return;
                    }

                    // Select a random server from the list of non-full servers
                    const randomServer = joinableServers[Math.floor(Math.random() * joinableServers.length)];
                    status.textContent = `Joining random server: ${randomServer.id} (${randomServer.playing}/${randomServer.maxPlayers})...`;
                    
                    Roblox.GameLauncher.joinGameInstance(placeId, randomServer.id);
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
