// ==UserScript==
// @name         Roblox Server Joiner UI
// @namespace    https://roblox.com/
// @version      1.1
// @description  Join Roblox servers using Game ID and Job ID
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
        document.getElementById('joinServerBtn').addEventListener('click', () => {
            const placeId = document.getElementById('placeIdInput').value.trim();
            const jobId = document.getElementById('jobIdInput').value.trim();
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

                status.textContent = 'Attempting to join...';

                if (jobId) {
                    Roblox.GameLauncher.joinGameInstance(placeId, jobId);
                } else {
                    Roblox.GameLauncher.joinMultiplayerGame(placeId);
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
