// music.js — Music portal UI, powered by the shared MusicEngine
document.addEventListener('DOMContentLoaded', () => {
    // Resolve engine: works whether running standalone or inside the shell iframe
    setTimeout(init, 80);

    function init() {
        const engine = window.MusicEngine || (window.parent && window.parent.MusicEngine);
        if (!engine) { console.warn('MusicEngine not loaded'); return; }

        const audio        = engine.audio;
        const PLAYLIST     = engine.PLAYLIST;
        const musicPlayBtn = document.getElementById('music-play-btn');
        const musicDisk    = document.getElementById('music-disk');
        const playStatus   = document.getElementById('play-status');
        const seekSlider   = document.getElementById('music-seek');
        const currentTimeEl = document.getElementById('current-time');
        const durationEl   = document.getElementById('duration');
        const musicTrack   = document.getElementById('music-track');
        const trackNameEl  = document.querySelector('.track-name');
        const trackCards   = document.querySelectorAll('.track-card');

        // ── Remove the static <audio> element — we use MusicEngine's instead ──
        const staticAudio = document.getElementById('bg-audio');
        if (staticAudio) staticAudio.remove();

        // ── Helpers ──────────────────────────────────────────────────────────
        function formatTime(s) {
            if (isNaN(s)) return '0:00';
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m}:${sec.toString().padStart(2, '0')}`;
        }

        function syncUI() {
            const paused = audio.paused;
            if (paused) {
                musicDisk.classList.remove('disk-spinning');
                musicTrack.classList.remove('music-playing');
                playStatus.textContent = 'Paused';
            } else {
                musicDisk.classList.add('disk-spinning');
                musicTrack.classList.add('music-playing');
                playStatus.textContent = 'Playing Now';
            }
        }

        function highlightCard(index) {
            trackCards.forEach(c => c.style.borderColor = 'rgba(184, 169, 154, 0.1)');
            trackCards.forEach(c => {
                const src = c.getAttribute('data-src');
                if (src && PLAYLIST[index] && src === PLAYLIST[index].src) {
                    c.style.borderColor = 'var(--lustre)';
                }
            });
        }

        function updateTrackDisplay(index) {
            if (!PLAYLIST[index]) return;
            if (trackNameEl) trackNameEl.textContent = PLAYLIST[index].name;
            highlightCard(index);
        }

        function setupSeekBar() {
            if (!audio.duration) return;
            seekSlider.max = audio.duration;
            durationEl.textContent = formatTime(audio.duration);
        }

        // ── Restore state from engine ─────────────────────────────────────────
        updateTrackDisplay(engine.getCurrentIndex());
        if (audio.readyState > 0) setupSeekBar();

        // ── Main play/pause click ──────────────────────────────────────────────
        musicPlayBtn.addEventListener('click', (e) => {
            if (e.target.id === 'music-seek') return;
            if (audio.paused) {
                audio.play().catch(err => {
                    playStatus.textContent = 'File Not Found';
                    console.error(err);
                });
            } else {
                audio.pause();
            }
        });

        // ── Seek bar ──────────────────────────────────────────────────────────
        audio.addEventListener('timeupdate', () => {
            if (!audio.duration) return;
            seekSlider.value = audio.currentTime;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        });

        audio.addEventListener('loadedmetadata', setupSeekBar);

        seekSlider.addEventListener('input', () => {
            audio.currentTime = seekSlider.value;
            currentTimeEl.textContent = formatTime(seekSlider.value);
        });

        // ── Audio state → UI sync ─────────────────────────────────────────────
        audio.addEventListener('play',  syncUI);
        audio.addEventListener('pause', syncUI);
        syncUI();

        // ── Track card clicks — delegate to MusicEngine ───────────────────────
        trackCards.forEach((card) => {
            card.addEventListener('click', () => {
                const src  = card.getAttribute('data-src');
                const name = card.getAttribute('data-name');
                if (!src) return;

                // Find track index in PLAYLIST
                const idx = PLAYLIST.findIndex(t => t.src === src);
                if (idx === -1) {
                    playStatus.textContent = 'Track not in playlist';
                    return;
                }

                engine.loadTrack(idx, true);
                updateTrackDisplay(idx);
                seekSlider.value = 0;
                currentTimeEl.textContent = '0:00';
                durationEl.textContent = '0:00';
            });
        });

        // ── React to track changes triggered from mini bar (prev/next) ─────────
        window.addEventListener('trackChanged', (e) => {
            const { index } = e.detail;
            updateTrackDisplay(index);
        });

        // Copy Protection
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
});
