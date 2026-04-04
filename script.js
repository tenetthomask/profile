document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        body.classList.add('light-mode');
        themeIcon.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');
        themeIcon.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    // Voice Command Layer (Web Speech API)
    const listenBtn = document.getElementById('listen-btn');
    const voiceOutput = document.getElementById('voice-output');

    if (listenBtn && voiceOutput) {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            listenBtn.addEventListener('click', () => {
                if (listenBtn.classList.contains('active')) {
                    recognition.stop();
                } else {
                    recognition.start();
                    listenBtn.classList.add('active');
                    voiceOutput.style.display = 'block';
                    voiceOutput.textContent = 'Listening...';
                }
            });

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                voiceOutput.textContent = `You said: "${transcript}"`;
                handleVoiceCommand(transcript);
                setTimeout(() => { voiceOutput.style.display = 'none'; }, 3000);
            };

            recognition.onend = () => { listenBtn.classList.remove('active'); };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                listenBtn.classList.remove('active');
                voiceOutput.textContent = 'Error: ' + event.error;
            };
        } else {
            listenBtn.style.display = 'none';
        }
    }

    function handleVoiceCommand(command) {
        // ── Resolve the shared music engine (works inside shell iframe & standalone) ──
        const engine = window.MusicEngine || (window.parent && window.parent.MusicEngine);

        // ── Music Commands ─────────────────────────────────────────────────────
        if (engine) {
            const audio    = engine.audio;
            const PLAYLIST = engine.PLAYLIST;

            // Play / resume
            if ((command.includes('play') && !command.includes('play ')) ||
                 command === 'play music' || command === 'resume') {
                audio.play().catch(() => {});
                voiceOutput.textContent = '▶ Playing';
                return;
            }

            // Pause / stop
            if (command.includes('pause') || command.includes('stop music') || command === 'stop') {
                audio.pause();
                voiceOutput.textContent = '⏸ Paused';
                return;
            }

            // Next song
            if (command.includes('next') || command.includes('skip')) {
                const nextIdx = (engine.getCurrentIndex() + 1) % PLAYLIST.length;
                engine.loadTrack(nextIdx, true);
                voiceOutput.textContent = `⏭ Now Playing: ${PLAYLIST[nextIdx].name}`;
                return;
            }

            // Previous song
            if (command.includes('previous') || command.includes('go back')) {
                const prevIdx = (engine.getCurrentIndex() - 1 + PLAYLIST.length) % PLAYLIST.length;
                engine.loadTrack(prevIdx, true);
                voiceOutput.textContent = `⏮ Now Playing: ${PLAYLIST[prevIdx].name}`;
                return;
            }

            // Repeat toggle
            if (command.includes('repeat')) {
                const btn = document.getElementById('mmb-repeat') ||
                            (window.parent && window.parent.document.getElementById('mmb-repeat'));
                if (btn) btn.click();
                voiceOutput.textContent = `🔁 Repeat ${engine.isRepeat() ? 'ON' : 'OFF'}`;
                return;
            }

            // Play a specific song by name — fuzzy match against playlist
            if (command.startsWith('play ')) {
                const query = command.slice(5).toLowerCase().trim();
                const match = PLAYLIST.find(t =>
                    t.name.toLowerCase().includes(query) ||
                    query.includes(t.name.toLowerCase().split(' ')[0])
                );
                if (match) {
                    const idx = PLAYLIST.indexOf(match);
                    engine.loadTrack(idx, true);
                    voiceOutput.textContent = `▶ Playing: ${match.name}`;
                    return;
                }
            }
        }

        // ── Navigation & Social Commands ──────────────────────────────────────
        if (command.includes('project') || command.includes('work')) {
            document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
            voiceOutput.textContent = '📂 Opening projects';
        } else if (command.includes('about') || command.includes('bio')) {
            document.getElementById('bio')?.scrollIntoView({ behavior: 'smooth' });
            voiceOutput.textContent = '👤 Opening bio';
        } else if (command.includes('contact') || command.includes('email')) {
            document.getElementById('social-email')?.click();
            voiceOutput.textContent = '✉️ Opening email';
        } else if (command.includes('dark mode') || command.includes('light mode') || command.includes('theme')) {
            themeToggle.click();
            voiceOutput.textContent = '🌓 Toggling theme';
        } else if (command.includes('instagram')) {
            document.getElementById('social-instagram')?.click();
            voiceOutput.textContent = '📸 Opening Instagram';
        } else if (command.includes('linkedin')) {
            document.getElementById('social-linkedin')?.click();
            voiceOutput.textContent = '💼 Opening LinkedIn';
        } else if (command.includes('github')) {
            document.getElementById('social-github')?.click();
            voiceOutput.textContent = '🐙 Opening GitHub';
        } else if (command.includes('spotify')) {
            document.getElementById('social-spotify')?.click();
            voiceOutput.textContent = '🎵 Opening Spotify';
        } else if (command.includes('social')) {
            document.getElementById('socials')?.scrollIntoView({ behavior: 'smooth' });
            voiceOutput.textContent = '🔗 Moving to socials';
        }
    }

    // Dynamic Tagline Typing Effect
    const tagline = document.getElementById('dynamic-tagline');
    const phrases = [
        "Python Developer | LLM Integration | Voice Automation",
        "Building Intelligent Agentic Workflows",
        "Crafting Future-Proof Digital Solutions"
    ];
    let phraseIndex = 0;

    function updateTagline() {
        if (!tagline) return;
        tagline.style.opacity = '0';
        setTimeout(() => {
            if (tagline) {
                phraseIndex = (phraseIndex + 1) % phrases.length;
                tagline.textContent = phrases[phraseIndex];
                tagline.style.opacity = '1';
            }
        }, 500);
    }

    if (tagline) {
        setInterval(updateTagline, 5000);
    }

    // Generalized Writing & Pop-up Animation logic
    function initAnimations() {
        // 1. Independent Title Pop-up Observer (Persistent)
        const titleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('pop-up');
                }
            });
        }, { threshold: 0 }); // Trigger as soon as 1px is visible

        document.querySelectorAll('.pop-up-title').forEach(title => {
            titleObserver.observe(title);
        });

        // 2. Independent Writing Reveal Observer (More Sensitive)
        const revealParagraphs = document.querySelectorAll('.writing-reveal');
        
        revealParagraphs.forEach(p => {
            p.style.perspective = '1000px';
            
            // Function to wrap letters
            function wrapLetters(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const chars = node.nodeValue.split('');
                    const fragment = document.createDocumentFragment();
                    chars.forEach(char => {
                        if (char === '\n' || char === '\r' || char === '\t') {
                            fragment.appendChild(document.createTextNode(char));
                        } else if (char === ' ') {
                            fragment.appendChild(document.createTextNode(' '));
                        } else {
                            const span = document.createElement('span');
                            span.className = 'reveal-char';
                            span.textContent = char;
                            span.style.display = 'inline-block';
                            span.style.opacity = '0';
                            span.style.transform = 'translateZ(-150px) scale(0.1) translateY(20px)';
                            span.style.filter = 'blur(8px)';
                            span.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                            fragment.appendChild(span);
                        }
                    });
                    node.replaceWith(fragment);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (!node.classList.contains('bio-subtext')) {
                        Array.from(node.childNodes).forEach(wrapLetters);
                    }
                }
            }
            
            wrapLetters(p);
            
            const chars = p.querySelectorAll('.reveal-char');
            let isTyping = false;
            let typeTimeout;
            
            const observer = new IntersectionObserver((entries) => {
                const entry = entries[0];

                if (entry.isIntersecting) {
                    if (isTyping) return;
                    isTyping = true;
                    
                    // Small delay to ensure the user has landed on the slide
                    setTimeout(() => {
                        chars.forEach(c => {
                            c.style.opacity = '0';
                            c.style.transform = 'translateZ(-150px) scale(0.1) translateY(20px)';
                            c.style.filter = 'blur(8px)';
                            c.style.textShadow = 'none';
                        });
                        
                        let index = 0;
                        function typeNext() {
                            if (index < chars.length) {
                                chars[index].style.opacity = '1';
                                chars[index].style.transform = 'translateZ(0) scale(1) translateY(0)';
                                chars[index].style.filter = 'blur(0px)';
                                chars[index].style.textShadow = '0 0 10px rgba(184, 169, 154, 0.4)';
                                
                                const idx = index;
                                setTimeout(() => {
                                    if (chars[idx]) chars[idx].style.textShadow = 'none';
                                }, 200);
                                
                                index++;
                                typeTimeout = setTimeout(typeNext, 5);
                            }
                        }
                        typeNext();
                    }, 300); 
                } else {
                    // Reset so it can replay
                    clearTimeout(typeTimeout);
                    isTyping = false;
                    chars.forEach(c => {
                        c.style.opacity = '0';
                        c.style.transform = 'translateZ(-150px) scale(0.1) translateY(20px)';
                        c.style.filter = 'blur(8px)';
                    });
                }
            }, { threshold: 0 }); // Trigger immediately
            
            observer.observe(p);
        });
    }

    initAnimations();

    // Auto-Scroll Projects & Touch to Drag
    const projectGallery = document.querySelector('.project-gallery');
    let autoScrollInterval = null;

    function startAutoScroll() {
        if (!projectGallery || autoScrollInterval) return;
        autoScrollInterval = setInterval(() => {
            const maxScroll = projectGallery.scrollWidth - projectGallery.clientWidth;
            if (projectGallery.scrollLeft >= maxScroll - 20) {
                projectGallery.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                projectGallery.scrollBy({ left: 350, behavior: 'smooth' });
            }
        }, 3000);
    }

    function stopAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }

    if (projectGallery) {
        startAutoScroll();

        // Pause auto-scroll on hover or touch
        projectGallery.addEventListener('mouseenter', stopAutoScroll);
        projectGallery.addEventListener('mouseleave', startAutoScroll);
        projectGallery.addEventListener('touchstart', stopAutoScroll, { passive: true });
        projectGallery.addEventListener('touchend', startAutoScroll);

        // Drag to scroll functionality
        let isDown = false;
        let isDragging = false;
        let startX;
        let scrollLeft;
        const dragThreshold = 5; // pixels to move before considering it a drag

        projectGallery.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragging = false;
            projectGallery.style.scrollBehavior = 'auto'; // Remove smooth scroll during drag
            startX = e.pageX - projectGallery.offsetLeft;
            scrollLeft = projectGallery.scrollLeft;
            stopAutoScroll();
        });

        projectGallery.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            
            const x = e.pageX - projectGallery.offsetLeft;
            const walk = (x - startX) * 2.5; // Scroll speed multiplier

            // If we've moved more than the threshold, it's a drag, not a click
            if (Math.abs(x - startX) > dragThreshold) {
                isDragging = true;
                e.preventDefault(); // Stop native ghost dragging
            }

            projectGallery.scrollLeft = scrollLeft - walk;
        });

        const endDrag = () => {
            if (isDown) {
                isDown = false;
                projectGallery.style.scrollBehavior = 'smooth';
                // Delay resuming auto-scroll to avoid jumpy transitions
                setTimeout(startAutoScroll, 100);
            }
        };

        projectGallery.addEventListener('mouseleave', endDrag);
        projectGallery.addEventListener('mouseup', endDrag);

        // Crucial: Intercept clicks during dragging to prevent navigation
        projectGallery.addEventListener('click', (e) => {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true); // Use capture phase to catch before cards see it
    }

    // Copy Protection
    document.addEventListener('contextmenu', (e) => e.preventDefault());
});
