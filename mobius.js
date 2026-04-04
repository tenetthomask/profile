/**
 * Möbius Strip — King Cards Background Animation
 * Uses Three.js for 3D rendering.
 * Strip is inverted (normals facing inward).
 * Scroll down → expands. Scroll up → contracts.
 */
(function () {
    'use strict';

    const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';

    /* ─── Load Three.js, then boot ────────────────────────────────────────── */
    const s = document.createElement('script');
    s.src = THREE_CDN;
    s.onload = boot;
    document.head.appendChild(s);

    /* ─── Draw a King card on a canvas and return a Three.CanvasTexture ───── */
    function makeCardTexture(suit, faceColor) {
        const W = 280, H = 400;
        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const c = cv.getContext('2d');

        /* Helper – rounded rectangle path */
        function rrect(x, y, w, h, r) {
            c.beginPath();
            c.moveTo(x + r, y);
            c.lineTo(x + w - r, y);
            c.arcTo(x + w, y, x + w, y + r, r);
            c.lineTo(x + w, y + h - r);
            c.arcTo(x + w, y + h, x + w - r, y + h, r);
            c.lineTo(x + r, y + h);
            c.arcTo(x, y + h, x, y + h - r, r);
            c.lineTo(x, y + r);
            c.arcTo(x, y, x + r, y, r);
            c.closePath();
        }

        /* Card body — very dark with champagne border */
        rrect(2, 2, W - 4, H - 4, 18);
        const bodyGrad = c.createLinearGradient(0, 0, 0, H);
        bodyGrad.addColorStop(0, '#0d0b09');
        bodyGrad.addColorStop(1, '#000000');
        c.fillStyle = bodyGrad;
        c.fill();
        c.strokeStyle = '#B8A99A';
        c.lineWidth = 3.5;
        c.stroke();

        /* Inner subtle border */
        rrect(10, 10, W - 20, H - 20, 12);
        c.strokeStyle = 'rgba(184,169,154,0.25)';
        c.lineWidth = 1;
        c.stroke();

        /* ── Corner labels (top-left) ── */
        c.fillStyle = faceColor;
        c.textAlign = 'left';
        c.font = 'bold 32px Georgia, serif';
        c.fillText('K', 16, 46);
        c.font = '24px Georgia, serif';
        c.fillText(suit, 19, 74);

        /* ── Corner labels (bottom-right, rotated 180°) ── */
        c.save();
        c.translate(W, H);
        c.rotate(Math.PI);
        c.fillStyle = faceColor;
        c.font = 'bold 32px Georgia, serif';
        c.textAlign = 'left';
        c.fillText('K', 16, 46);
        c.font = '24px Georgia, serif';
        c.fillText(suit, 19, 74);
        c.restore();

        /* ── Centre — halo around symbol, symbol drawn sharp ── */
        c.textAlign = 'center';

        /* Step 1: paint a soft blurred halo ring AROUND the symbol area.
           canvas filter blurs everything drawn while active.             */
        c.save();
        c.filter = 'blur(18px)';
        c.globalAlpha = 0.55;
        c.fillStyle = faceColor;
        c.font = '130px Georgia, serif';
        c.fillText(suit, W / 2, H / 2 + 50);   // blurred copy = halo
        c.restore();

        /* Step 2: draw the symbol itself — crisp, no shadow */
        c.shadowBlur = 0;
        c.shadowColor = 'transparent';
        c.globalAlpha = 1;
        c.fillStyle = faceColor;
        c.font = '130px Georgia, serif';
        c.fillText(suit, W / 2, H / 2 + 50);

        /* K overlay in matching tone */
        c.globalAlpha = 0.35; // increased from extremely faint to clearly visible
        c.fillStyle = faceColor; // changed from hardcoded muted gold to match the card's specific suit colour
        c.font = 'bold 85px Georgia, serif';
        c.fillText('K', W / 2, H / 2 + 15);
        c.globalAlpha = 1.0; // reset transparency

        return new THREE.CanvasTexture(cv);
    }

    /* ─── Main init ─────────────────────────────────────────────────────── */
    function boot() {
        /* Fixed background canvas */
        const canvas = document.createElement('canvas');
        canvas.id = 'mobius-bg';
        Object.assign(canvas.style, {
            position: 'fixed',
            top: '0', left: '0',
            width: '100vw', height: '100vh',
            zIndex: '0',
            pointerEvents: 'none',
        });
        document.body.prepend(canvas);

        /* Push page content above the canvas */
        const container = document.querySelector('.container');
        if (container) {
            container.style.position = 'relative';
            container.style.zIndex = '1';
        }
        document.querySelectorAll('.voice-layer, .theme-toggle').forEach(el => {
            el.style.zIndex = '1001';
        });

        /* ── Renderer ── */
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setSize(innerWidth, innerHeight);

        /* ── Scene & Camera ── */
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 100);
        camera.position.z = 10;

        /* ── Lighting ── */
        scene.add(new THREE.AmbientLight(0xffffff, 0.45));

        const goldLight = new THREE.PointLight(0xD4B896, 2.5, 40);
        goldLight.position.set(5, 5, 7);
        scene.add(goldLight);

        const coolLight = new THREE.PointLight(0x4466AA, 1.2, 40);
        coolLight.position.set(-5, -5, 5);
        scene.add(coolLight);

        /* ── Card definitions — full Champagne Noir palette ── */
        const CARD_DEFS = [
            { suit: '♠', color: '#F2E8DC' },   // Spades   — Ivory Alabaster
            { suit: '♥', color: '#B8A99A' },   // Hearts   — Muted Gold
            { suit: '♦', color: '#F2E8DC' },   // Diamonds — Ivory Alabaster
            { suit: '♣', color: '#B8A99A' },   // Clubs    — Muted Gold
        ];
        const textures = CARD_DEFS.map(d => makeCardTexture(d.suit, d.color));

        /* ── Build hollow disk of cards ── */
        const stripGroup = new THREE.Group();
        scene.add(stripGroup);

        const NUM_CARDS = 24;   // cards around the ring
        const RADIUS = 4.9;  // ring radius — large enough to frame the hero section

        for (let i = 0; i < NUM_CARDS; i++) {
            const u = (i / NUM_CARDS) * Math.PI * 2;

            /* ---- Position on the ring ---- */
            const px = RADIUS * Math.cos(u);
            const py = RADIUS * Math.sin(u);

            /* ---- Disk orientation: cards face outward (+Z toward viewer).
               Width is tangential so cards tile side-by-side around the ring.
               Tilt in the animation loop shows the underside.            */
            const tangent = new THREE.Vector3(-Math.sin(u), Math.cos(u), 0); // along ring
            const radial = new THREE.Vector3(Math.cos(u), Math.sin(u), 0); // outward
            const faceNorm = new THREE.Vector3(0, 0, 1);                        // toward viewer

            /* ---- Card mesh ---- */
            const geo = new THREE.PlaneGeometry(0.72, 1.05);
            const mat = new THREE.MeshStandardMaterial({
                map: textures[i % 4],
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85,
                roughness: 0.3,
                metalness: 0.2,
            });

            const card = new THREE.Mesh(geo, mat);
            card.position.set(px, py, 0);

            /* Width = tangential, Height = radial (cards point outward) */
            const rotMat = new THREE.Matrix4().makeBasis(tangent, radial, faceNorm);
            card.setRotationFromMatrix(rotMat);

            stripGroup.add(card);
        }

        /* ── Scroll → scale & position transition ── */
        let targetScale = 1;
        let currentScale = 1;
        let targetY = 0;
        let currentY = 0;

        function updateAlignment() {
            const hero = document.querySelector('.hero-main');
            const grid = document.querySelector('.qualities-grid');
            if (!hero || !grid) return;

            const maxScroll = document.body.scrollHeight - innerHeight;
            const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

            // 1. Calculate Multi-Phase Scaling
            if (progress < 0.5) {
                const expansionFactor = progress / 0.5;
                targetScale = 1.0 + (expansionFactor * 1.5); // Peak at 2.5
            } else {
                const contractionFactor = (progress - 0.5) / 0.5;
                targetScale = 2.5 - (contractionFactor * 1.35); // Final scale of 1.15 for better framing
            }

            // 2. Viewport-Relative Positioning
            const hRect = hero.getBoundingClientRect();
            const gRect = grid.getBoundingClientRect();

            // Viewport centers (relative to screen)
            const hcy = hRect.top + hRect.height / 2;
            const gcy = gRect.top + gRect.height / 2;

            // Linear transition from Hero Y to Grid Y across entire scroll
            const activeY = hcy + (gcy - hcy) * progress;

            // Convert Viewport Y to 3D World Y
            const ndcY = -(activeY / innerHeight) * 2 + 1;
            const halfH = Math.tan((52 / 2) * Math.PI / 180) * camera.position.z;

            // X position stays aligned with Hero center
            const hcx = hRect.left + hRect.width / 2;
            const ndcX = (hcx / innerWidth) * 2 - 1;
            const halfW = halfH * camera.aspect;

            stripGroup.position.x = ndcX * halfW;
            targetY = ndcY * halfH;
        }

        window.addEventListener('scroll', updateAlignment, { passive: true });
        window.addEventListener('resize', () => {
            renderer.setSize(innerWidth, innerHeight);
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            updateAlignment();
        });

        updateAlignment(); // Initial run

        /* ── Spin Interaction ── */
        let isDragging = false;
        let previousX = 0;
        let spinAngle = 0;
        let spinVelocity = 0;

        function onPointerDown(e) {
            const hero = document.getElementById('heroSection');
            if (!hero || !hero.contains(e.target)) return;

            isDragging = true;
            previousX = e.clientX || (e.touches && e.touches[0].clientX);
            spinVelocity = 0;
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            const currentX = e.clientX || (e.touches && e.touches[0].clientX);
            if (currentX === undefined) return;

            const deltaX = currentX - previousX;
            spinVelocity = deltaX * 0.005; // Adjust drag sensitivity
            spinAngle += spinVelocity;
            previousX = currentX;
        }

        function onPointerUp() {
            isDragging = false;
        }

        window.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        window.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);

        /* ── Animation loop ── */
        const clock = new THREE.Clock();
        (function loop() {
            requestAnimationFrame(loop);
            const t = clock.getElapsedTime();

            if (!isDragging) {
                spinVelocity *= 0.95;
                spinAngle += spinVelocity;
            }

            stripGroup.rotation.z = (t * 0.12) + spinAngle;
            stripGroup.rotation.x = -Math.PI * 0.22 + Math.sin(t * 0.08) * 0.12;
            stripGroup.rotation.y = Math.cos(t * 0.06) * 0.1;

            /* Smooth lerping for Scale & Y-position */
            currentScale += (targetScale - currentScale) * 0.055;
            stripGroup.scale.setScalar(currentScale);

            currentY += (targetY - currentY) * 0.045;
            stripGroup.position.y = currentY;

            goldLight.position.x = Math.sin(t * 0.25) * 6;
            goldLight.position.y = Math.cos(t * 0.25) * 6;

            renderer.render(scene, camera);
        })();
    }
})();
