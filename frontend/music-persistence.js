/**
 * music-persistence.js
 * - Runs ONCE in shell.html (the permanent parent frame).
 * - When loaded inside an iframe (all content pages), it simply exposes
 *   the parent's engine and exits — no duplicate audio, no duplicate bar.
 * - Pauses when the browser tab is hidden, resumes when visible again.
 */
(function () {
    // ── If we're inside the shell's iframe, proxy to parent and stop ──────────
    if (window !== window.top) {
        try {
            // Give music.js (and any other scripts) access to the parent engine
            window.MusicEngine = window.parent.MusicEngine;
        } catch (e) { /* cross-origin guard */ }
        return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Everything below runs ONLY in shell.html
    // ══════════════════════════════════════════════════════════════════════════

    const PLAYLIST = [
        { name: 'Parano (feat.DDB) slowed', artist: 'Frozy',                             src: 'parano_slowed.mp3'   },
        { name: 'Pink + White',             artist: 'Frank Ocean',                       src: 'pink_and_white.mp3'  },
        { name: 'Softcore',                 artist: 'The Neighbourhood',                 src: 'softcore.mp3'        },
        { name: 'sdp interlude',            artist: 'Travis Scott',                      src: 'sdp_interlude.mp3'   },
        { name: 'Hex',                      artist: '80purppp',                          src: 'hex.mp3'             },
        { name: 'Let U Go',                 artist: 'Central Cee',                       src: 'let_u_go.mp3'        },
        { name: 'Watch',                     artist: 'Billie Eilish',                      src: 'watch.mp3'           },
        { name: 'My Eyes',                  artist: 'Travis Scott',                      src: 'my_eyes.mp3'         },
        { name: 'Judas',                    artist: 'Lady Gaga',                         src: 'judas.mp3'           },
    ];

    // ── Restore Saved State ───────────────────────────────────────────────────
    let currentIndex    = parseInt(localStorage.getItem('musicIndex')  || '0');
    let isRepeat        = localStorage.getItem('musicRepeat')  === 'true';
    let wasPlaying      = localStorage.getItem('musicPlaying') === 'true';
    let savedTime       = parseFloat(localStorage.getItem('musicTime') || '0');

    // ── Audio Element ─────────────────────────────────────────────────────────
    const audio   = new Audio();
    audio.volume  = 0.8;
    audio.src     = PLAYLIST[currentIndex].src;

    audio.addEventListener('loadedmetadata', () => {
        if (savedTime > 0 && savedTime < audio.duration - 1) {
            audio.currentTime = savedTime;
        }
        if (wasPlaying) audio.play().catch(() => {});
    });

    // ── Auto-Next / Repeat ────────────────────────────────────────────────────
    audio.addEventListener('ended', () => {
        if (isRepeat) {
            audio.currentTime = 0;
            audio.play();
        } else {
            currentIndex = (currentIndex + 1) % PLAYLIST.length;
            loadTrack(currentIndex, true);
        }
    });

    // ── Page Visibility — pause on tab switch, resume on return ───────────────
    let playingBeforeHide = false;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            playingBeforeHide = !audio.paused;
            if (!audio.paused) audio.pause();
        } else {
            if (playingBeforeHide) audio.play().catch(() => {});
        }
    });

    // ── Track Loader ──────────────────────────────────────────────────────────
    function loadTrack(index, autoPlay = false) {
        currentIndex  = index;
        savedTime     = 0;          // reset so loadedmetadata starts from beginning
        audio.src     = PLAYLIST[index].src;
        audio.load();
        if (autoPlay) audio.play().catch(() => {});
        localStorage.setItem('musicIndex', index);
        localStorage.setItem('musicTime',  0);
        updateBarInfo();
        updatePlayButton();
        // Notify any page that listens (e.g. music.html inside the iframe)
        try {
            const iframe = document.getElementById('site-frame');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.dispatchEvent(
                    new CustomEvent('trackChanged', { detail: { index, track: PLAYLIST[index], playing: autoPlay } })
                );
            }
        } catch (e) {}
    }

    // ── Persist State Every Second ────────────────────────────────────────────
    setInterval(() => {
        localStorage.setItem('musicTime',    audio.currentTime);
        localStorage.setItem('musicPlaying', !audio.paused);
        localStorage.setItem('musicIndex',   currentIndex);
        localStorage.setItem('musicRepeat',  isRepeat);
    }, 1000);

    // ── Mini Bar Helpers ──────────────────────────────────────────────────────
    function updateBarInfo() {
        const t = PLAYLIST[currentIndex];
        const n = document.getElementById('mmb-name');
        const a = document.getElementById('mmb-artist');
        if (n) n.textContent = t.name;
        if (a) a.textContent = t.artist;
    }

    function updatePlayButton() {
        const btn  = document.getElementById('mmb-play');
        const disk = document.getElementById('mmb-disk');
        const bar  = document.getElementById('mini-music-bar');
        if (btn)  btn.innerHTML = audio.paused ? '&#9654;' : '&#9646;&#9646;';
        if (disk) audio.paused ? disk.classList.remove('spinning') : disk.classList.add('spinning');
        // Show bar the first time music plays
        if (bar && !audio.paused) bar.classList.add('visible');
    }

    function updateRepeatButton() {
        const btn = document.getElementById('mmb-repeat');
        if (btn) btn.classList.toggle('mmb-active', isRepeat);
    }

    audio.addEventListener('play',  updatePlayButton);
    audio.addEventListener('pause', updatePlayButton);

    // ── Inject Mini Bar Styles ────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap');

        #mini-music-bar {
            position: fixed;
            bottom: 1.5rem;
            left: 50%;
            transform: translateX(-50%) translateY(120%);
            opacity: 0;
            pointer-events: none;
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1.5rem;
            background: rgba(10, 10, 10, 0.82);
            backdrop-filter: blur(24px) saturate(160%);
            -webkit-backdrop-filter: blur(24px) saturate(160%);
            border: 1px solid rgba(184, 169, 154, 0.18);
            border-radius: 50px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,169,154,0.04);
            min-width: 340px;
            max-width: 90vw;
            user-select: none;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                        opacity 0.3s ease,
                        border-color 0.3s;
        }
        #mini-music-bar.visible {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
            pointer-events: all;
        }
        #mini-music-bar:hover { border-color: rgba(184,169,154,0.35); }

        #mmb-disk {
            width: 34px; height: 34px;
            border-radius: 50%;
            border: 2px solid rgba(184,169,154,0.45);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            transition: border-color 0.3s, box-shadow 0.3s;
        }
        #mmb-disk::after {
            content: '';
            width: 8px; height: 8px;
            border-radius: 50%;
            background: rgba(184,169,154,0.6);
        }
        #mmb-disk.spinning {
            border-color: rgba(184,169,154,1);
            box-shadow: 0 0 12px rgba(184,169,154,0.3);
            animation: mmbSpin 4s linear infinite;
        }
        @keyframes mmbSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .mmb-info { flex-grow:1; overflow:hidden; min-width:0; }
        #mmb-name {
            display:block;
            font-family:'Outfit',sans-serif; font-size:0.85rem; font-weight:500;
            color:rgba(242,232,220,0.95); letter-spacing:0.5px;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        #mmb-artist {
            display:block;
            font-family:'Outfit',sans-serif; font-size:0.7rem;
            color:rgba(184,169,154,0.6); letter-spacing:1px; text-transform:uppercase;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;
        }
        .mmb-controls { display:flex; align-items:center; gap:0.25rem; flex-shrink:0; }
        .mmb-btn {
            background:none; border:none; color:rgba(184,169,154,0.7);
            cursor:pointer; width:30px; height:30px; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-size:1rem; transition:all 0.2s; padding:0;
        }
        .mmb-btn:hover { color:rgba(242,232,220,1); background:rgba(184,169,154,0.1); }
        #mmb-play {
            width:36px; height:36px; font-size:0.9rem;
            border:1.5px solid rgba(184,169,154,0.3);
            color:rgba(242,232,220,0.9);
        }
        #mmb-play:hover { border-color:rgba(184,169,154,0.8); }
        #mmb-prev, #mmb-next { font-size:1.5rem; line-height:1; }
        #mmb-repeat.mmb-active { color:rgba(184,169,154,1); text-shadow:0 0 8px rgba(184,169,154,0.5); }

        #mmb-progress {
            width:100%; height:2px;
            background:rgba(184,169,154,0.12);
            position:absolute; bottom:0; left:0;
            border-radius:0 0 50px 50px; overflow:hidden;
        }
        #mmb-progress-fill {
            height:100%; background:rgba(184,169,154,0.5);
            width:0%; transition:width 1s linear;
        }
    `;
    document.head.appendChild(style);

    // ── Inject Mini Bar HTML ──────────────────────────────────────────────────
    function createBar() {
        const t   = PLAYLIST[currentIndex];
        const bar = document.createElement('div');
        bar.id    = 'mini-music-bar';
        bar.innerHTML = `
            <div id="mmb-disk"></div>
            <div class="mmb-info">
                <span id="mmb-name">${t.name}</span>
                <span id="mmb-artist">${t.artist}</span>
            </div>
            <div class="mmb-controls">
                <button class="mmb-btn" id="mmb-prev"   title="Previous">&#8249;</button>
                <button class="mmb-btn" id="mmb-play"   title="Play / Pause">&#9654;</button>
                <button class="mmb-btn" id="mmb-next"   title="Next">&#8250;</button>
                <button class="mmb-btn ${isRepeat ? 'mmb-active' : ''}" id="mmb-repeat" title="Repeat">&#8635;</button>
            </div>
            <div id="mmb-progress"><div id="mmb-progress-fill"></div></div>
        `;
        document.body.appendChild(bar);

        // Controls
        document.getElementById('mmb-play').addEventListener('click', () => {
            audio.paused ? audio.play().catch(() => {}) : audio.pause();
        });

        document.getElementById('mmb-prev').addEventListener('click', () => {
            if (audio.currentTime > 3) {
                audio.currentTime = 0;
            } else {
                currentIndex = (currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
                loadTrack(currentIndex, !audio.paused);
            }
        });

        document.getElementById('mmb-next').addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % PLAYLIST.length;
            loadTrack(currentIndex, !audio.paused);
        });

        document.getElementById('mmb-repeat').addEventListener('click', () => {
            isRepeat = !isRepeat;
            updateRepeatButton();
        });

        // Progress fill update
        setInterval(() => {
            if (audio.duration) {
                const pct  = (audio.currentTime / audio.duration) * 100;
                const fill = document.getElementById('mmb-progress-fill');
                if (fill) fill.style.width = pct + '%';
            }
        }, 1000);

        updatePlayButton();
        updateRepeatButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBar);
    } else {
        createBar();
    }

    // ── Global API ────────────────────────────────────────────────────────────
    window.MusicEngine = {
        audio,
        PLAYLIST,
        loadTrack,
        getCurrentIndex: () => currentIndex,
        isRepeat:        () => isRepeat,
    };
})();
