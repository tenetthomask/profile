// cursor.js
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'antigravity-cursor-field';
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0', left: '0',
        width: '100vw', height: '100vh',
        pointerEvents: 'none',
        zIndex: '0' // shares z-index with the 3D disk
    });
    // Append to body so it sits behind the UI elements
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height, cx, cy;
    let particles = [];
    // Champagne Noir Palette: Muted Gold, Soft Alabaster, Ivory, Deep Bronze
    const colors = ['#B8A99A', '#F2E8DC', '#FFFFF0', '#8C7A6B'];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        cx = width / 2;
        cy = height / 2;
        initParticles();
    }

    class Particle {
        constructor(radius, angle) {
            this.baseRadius = radius;
            this.baseAngle = angle;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.calcBase();
            this.x = this.bx;
            this.y = this.by;
            this.vx = 0;
            this.vy = 0;
        }

        calcBase() {
            // Calculate starting position based on center
            this.bx = cx + Math.cos(this.baseAngle) * this.baseRadius;
            this.by = cy + Math.sin(this.baseAngle) * this.baseRadius;
        }

        update(mouseX, mouseY) {
            // Distance to mouse
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Antigravity repulsion from cursor
            const maxDist = 200; // Interaction radius
            let targetX = this.bx;
            let targetY = this.by;

            if (dist < maxDist && dist > 0) {
                const force = Math.pow((maxDist - dist) / maxDist, 1.5);
                const pushX = (dx / dist) * force * 120; // Repel distance
                const pushY = (dy / dist) * force * 120;
                targetX += pushX;
                targetY += pushY;
            }

            // Spring effect to return to base position
            const ax = (targetX - this.x) * 0.08; // Spring tension
            const ay = (targetY - this.y) * 0.08;

            this.vx += ax;
            this.vy += ay;

            // Friction
            this.vx *= 0.75;
            this.vy *= 0.75;

            this.x += this.vx;
            this.y += this.vy;
            
            // Subtly rotate the entire field slowly
            this.baseAngle += 0.0005;
            this.calcBase();
        }

        draw(ctx) {
            ctx.beginPath();
            // Draw dashes pointing outward slightly angled
            const dirX = Math.cos(this.baseAngle);
            const dirY = Math.sin(this.baseAngle);
            const len = 1.5; // Very small dash length
            
            ctx.moveTo(this.x - dirX * len, this.y - dirY * len);
            ctx.lineTo(this.x + dirX * len, this.y + dirY * len);
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.2; // Very thin
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.4; // Lower opacity for subtlety
            ctx.stroke();
        }
    }

    function initParticles() {
        particles = [];
        // Build concentric rings similar to the reference image
        const numRings = 15;
        // Extend further out than the screen so it covers corners
        const maxRadius = Math.max(width, height) * 0.8;
        const radiusStep = maxRadius / numRings;
        
        for (let r = 2; r <= numRings; r++) {
            const rad = r * radiusStep;
            // Particles get sparser further out, similar to an exploding star
            const numPoints = Math.floor(2 * Math.PI * rad / 45); 
            for (let i = 0; i < numPoints; i++) {
                // Add a slight offset to create the spiral/scattered look
                const angleOffset = (r % 2 === 0) ? (Math.PI / numPoints) : 0;
                const angle = (i / numPoints) * Math.PI * 2 + angleOffset;
                particles.push(new Particle(rad, angle));
            }
        }
    }

    window.addEventListener('resize', resize);
    
    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, {passive:true});

    // Send mouse far away when leaving the tab/window
    window.addEventListener('mouseout', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    resize();

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
            p.update(mouse.x, mouse.y);
            p.draw(ctx);
        }
        requestAnimationFrame(animate);
    }
    animate();
});
