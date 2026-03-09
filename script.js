/* =============================================
   CINEMATIC PORTFOLIO — MAIN SCRIPT
   ============================================= */

// ——— DOM References ———
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const loader = $('#loader');
const loaderFill = $('#loaderFill');
const loaderPercent = $('#loaderPercent');
const sceneDoor = $('#scene-door');
const sceneWorkspace = $('#scene-workspace');
const sceneTransform = $('#scene-transform');
const portfolio = $('#portfolio');
const codeContent = $('#codeContent');
const lineNumbers = $('#lineNumbers');
const terminalBody = $('#terminalBody');
const keyboardKeys = $('#keyboardKeys');
const cursorEl = $('#cursor');
const devCharacter = $('#devCharacter');
const welcomeOverlay = $('#welcomeOverlay');
const enterBtn = $('#enterPortfolioBtn');
const floatingCode = $('#floatingCode');
const mainNav = $('#mainNav');
const hamburger = $('#hamburger');
const mobileMenu = $('#mobileMenu');
const cursorDot = $('#cursor-dot');
const cursorOutline = $('#cursor-outline');
const threeCanvas = $('#three-canvas');

// ——— STATE ———
let currentScene = 'loader';
let typingInterval = null;

// =============================================
// THREE.JS BACKGROUND PARTICLES
// =============================================
function initThreeBackground() {
    const isMobile = window.innerWidth < 768;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

    // Particles (reduce on mobile for performance)
    const particleCount = isMobile ? 200 : 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        // Blue-purple palette
        const r = 0.29 + Math.random() * 0.2;
        const g = 0.37 + Math.random() * 0.25;
        const b = 0.8 + Math.random() * 0.2;
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Connection lines (fewer on mobile)
    const lineGeo = new THREE.BufferGeometry();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.06 });
    const linePositions = [];
    const lineCount = isMobile ? 30 : 80;
    for (let i = 0; i < lineCount; i++) {
        const a = Math.floor(Math.random() * particleCount);
        const b = Math.floor(Math.random() * particleCount);
        linePositions.push(positions[a*3], positions[a*3+1], positions[a*3+2]);
        linePositions.push(positions[b*3], positions[b*3+1], positions[b*3+2]);
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    camera.position.z = 5;

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
        requestAnimationFrame(animate);
        points.rotation.y += 0.0008;
        points.rotation.x += 0.0003;
        lines.rotation.y += 0.0008;
        lines.rotation.x += 0.0003;
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// =============================================
// CUSTOM CURSOR
// =============================================
function initCursor() {
    if (window.innerWidth < 768) return;
    document.addEventListener('mousemove', (e) => {
        cursorDot.style.left = e.clientX - 4 + 'px';
        cursorDot.style.top = e.clientY - 4 + 'px';
        cursorOutline.style.left = e.clientX - 18 + 'px';
        cursorOutline.style.top = e.clientY - 18 + 'px';
    });
    document.querySelectorAll('a, button, .door-frame, .project-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.style.transform = 'scale(2)';
            cursorOutline.style.transform = 'scale(1.5)';
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.style.transform = 'scale(1)';
            cursorOutline.style.transform = 'scale(1)';
        });
    });
}

// =============================================
// LOADING SCREEN
// =============================================
function runLoader() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 12 + 3;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                gsap.to(loader, {
                    opacity: 0, duration: 0.6,
                    onComplete: () => {
                        loader.style.display = 'none';
                        currentScene = 'door';
                        gsap.from(sceneDoor, { opacity: 0, duration: 0.8 });
                    }
                });
            }, 400);
        }
        loaderFill.style.width = progress + '%';
        loaderPercent.textContent = Math.round(progress) + '%';
    }, 200);
}

// =============================================
// SCENE 1: DOOR ANIMATION
// =============================================
function initDoorScene() {
    sceneDoor.addEventListener('click', openDoor);
    sceneDoor.addEventListener('touchend', (e) => {
        e.preventDefault();
        openDoor();
    });
}

function openDoor() {
    if (currentScene !== 'door') return;
    currentScene = 'transitioning';

    const doorLeft = sceneDoor.querySelector('.door-left');
    const doorRight = sceneDoor.querySelector('.door-right');
    const hint = sceneDoor.querySelector('.door-hint');

    gsap.to(hint, { opacity: 0, duration: 0.3 });
    doorLeft.classList.add('open-left');
    doorRight.classList.add('open-right');

    // Light burst from behind door
    gsap.to('.door-glow', { opacity: 1, scale: 3, duration: 1.2 });

    setTimeout(() => {
        gsap.to(sceneDoor, {
            opacity: 0, scale: 1.1, duration: 0.8,
            onComplete: () => {
                sceneDoor.classList.add('hidden');
                sceneWorkspace.classList.remove('hidden');
                currentScene = 'workspace';
                startWorkspaceAnimation();
            }
        });
    }, 1200);
}

// =============================================
// KEYBOARD GENERATION
// =============================================
function generateKeyboard() {
    const keys = 'QWERTYUIOP ASDFGHJKL ZXCVBNM'.split('');
    keys.forEach(k => {
        const key = document.createElement('div');
        key.className = 'key';
        key.textContent = k === ' ' ? '' : k;
        key.dataset.key = k;
        keyboardKeys.appendChild(key);
    });
}

// =============================================
// SCENE 2: WORKSPACE — CODE TYPING
// =============================================
const codeLines = [
    '<span style="color:#c586c0">const</span> <span style="color:#4fc1ff">deekshith</span> = {',
    '  <span style="color:#9cdcfe">name</span>: <span style="color:#ce9178">"Deekshith"</span>,',
    '  <span style="color:#9cdcfe">role</span>: <span style="color:#ce9178">"Web Developer & Video Editor"</span>,',
    '  <span style="color:#9cdcfe">skills</span>: [',
    '    <span style="color:#ce9178">"HTML"</span>, <span style="color:#ce9178">"CSS"</span>, <span style="color:#ce9178">"JavaScript"</span>,',
    '    <span style="color:#ce9178">"React"</span>, <span style="color:#ce9178">"Node.js"</span>,',
    '    <span style="color:#ce9178">"Video Editing"</span>, <span style="color:#ce9178">"Motion Graphics"</span>',
    '  ],',
    '  <span style="color:#9cdcfe">experience</span>: <span style="color:#b5cea8">3</span>,',
    '  <span style="color:#9cdcfe">passion</span>: <span style="color:#ce9178">"Building digital experiences"</span>,',
    '  <span style="color:#dcdcaa">createPortfolio</span>() {',
    '    <span style="color:#c586c0">return</span> <span style="color:#ce9178">"Let\'s dive in!"</span>;',
    '  }',
    '};',
    '',
    '<span style="color:#6a9955">// Initializing portfolio...</span>',
    '<span style="color:#c586c0">const</span> <span style="color:#4fc1ff">portfolio</span> = deekshith.<span style="color:#dcdcaa">createPortfolio</span>();',
    '<span style="color:#dcdcaa">console</span>.<span style="color:#dcdcaa">log</span>(<span style="color:#4fc1ff">portfolio</span>);',
];

const terminalLines = [
    { text: '<span style="color:#27c93f">PS C:\\portfolio&gt;</span> npm start', delay: 500 },
    { text: '<span style="color:#888">Starting development server...</span>', delay: 800 },
    { text: '<span style="color:#f0db4f">⚡ Compiling portfolio...</span>', delay: 600 },
    { text: '<span style="color:#27c93f">✓ Portfolio ready at localhost:3000</span>', delay: 400 },
    { text: '<span style="color:#4a9eff">🚀 Launching experience...</span>', delay: 600 },
];

function startWorkspaceAnimation() {
    gsap.from(sceneWorkspace, { opacity: 0, duration: 0.6 });

    let lineIndex = 0;
    let charIndex = 0;
    let currentText = '';

    function updateLineNumbers() {
        let nums = '';
        for (let i = 1; i <= lineIndex + 1; i++) {
            nums += i + '\n';
        }
        lineNumbers.textContent = nums;
    }

    function getPlainText(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function typeCode() {
        if (lineIndex >= codeLines.length) {
            clearInterval(typingInterval);
            setTimeout(runTerminal, 600);
            return;
        }

        const plainLine = getPlainText(codeLines[lineIndex]);
        if (charIndex <= plainLine.length) {
            // Build the display: completed lines + current partial line + cursor
            let display = '';
            for (let i = 0; i < lineIndex; i++) {
                display += codeLines[i] + '\n';
            }
            // Show partial line with the full HTML up to char position
            display += codeLines[lineIndex].substring(0, getHtmlPosition(codeLines[lineIndex], charIndex));
            codeContent.innerHTML = display + '<span class="cursor-blink"></span>';
            updateLineNumbers();

            // Random key press effect
            pressRandomKey();
            charIndex++;
        } else {
            charIndex = 0;
            lineIndex++;
        }
    }

    typingInterval = setInterval(typeCode, 40);
}

function getHtmlPosition(html, textPos) {
    let textCount = 0;
    let inTag = false;
    for (let i = 0; i < html.length; i++) {
        if (html[i] === '<') inTag = true;
        if (!inTag) {
            if (textCount === textPos) return i;
            textCount++;
        }
        if (html[i] === '>') inTag = false;
    }
    return html.length;
}

function pressRandomKey() {
    const keys = keyboardKeys.querySelectorAll('.key');
    if (keys.length === 0) return;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    randomKey.classList.add('pressed');
    setTimeout(() => randomKey.classList.remove('pressed'), 120);
}

function runTerminal() {
    let idx = 0;
    function nextLine() {
        if (idx >= terminalLines.length) {
            setTimeout(showCharacterTurn, 800);
            return;
        }
        const line = terminalLines[idx];
        const div = document.createElement('div');
        div.innerHTML = line.text;
        div.style.opacity = '0';
        terminalBody.appendChild(div);
        gsap.to(div, { opacity: 1, duration: 0.3 });
        idx++;
        setTimeout(nextLine, line.delay);
    }
    nextLine();
}

// =============================================
// SCENE 2B: CHARACTER TURN + WELCOME
// =============================================
function showCharacterTurn() {
    const charHead = devCharacter.querySelector('.char-head');
    charHead.classList.add('turned');

    setTimeout(() => {
        welcomeOverlay.classList.add('show');
        gsap.to('.welcome-line.line1', { opacity: 1, y: 0, duration: 0.8, delay: 0.2 });
        gsap.to('.welcome-line.line2', { opacity: 1, y: 0, duration: 0.8, delay: 0.6 });
        gsap.to('.enter-btn', { opacity: 1, y: 0, duration: 0.8, delay: 1.0 });
    }, 1200);
}

// =============================================
// SCENE 3: CODE TRANSFORMATION
// =============================================
function initEnterButton() {
    enterBtn.addEventListener('click', startTransformation);
    enterBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        startTransformation();
    });
}

function startTransformation() {
    if (currentScene !== 'workspace') return;
    currentScene = 'transforming';

    // Fade workspace and show transform scene
    gsap.to(sceneWorkspace, {
        opacity: 0, scale: 0.95, duration: 0.8,
        onComplete: () => {
            sceneWorkspace.classList.add('hidden');
            sceneTransform.classList.remove('hidden');
            runCodeTransformAnimation();
        }
    });
}

function runCodeTransformAnimation() {
    const codeSnippets = [
        'const portfolio = {', 'name: "Developer"', 'skills: ["HTML", "CSS", "JS"]',
        'createWebsite()', 'return <Component />', 'import React from "react"',
        'function App() {', 'export default Hero', '.hero { display: flex; }',
        'animation: fadeIn 1s', 'const router = express()', 'npm run build',
        'git commit -m "deploy"', 'docker compose up', 'const db = mongoose.connect()',
    ];

    // Create floating code lines
    codeSnippets.forEach((code, i) => {
        const el = document.createElement('div');
        el.className = 'float-code-line';
        el.textContent = code;
        el.style.left = Math.random() * 80 + 10 + '%';
        el.style.top = Math.random() * 80 + 10 + '%';
        floatingCode.appendChild(el);

        gsap.to(el, {
            opacity: 1,
            duration: 0.3,
            delay: i * 0.1,
        });

        // Move toward center
        gsap.to(el, {
            left: '50%',
            top: '50%',
            x: '-50%',
            y: '-50%',
            scale: 0.5,
            opacity: 0,
            duration: 1.5,
            delay: 1.5 + i * 0.05,
            ease: 'power2.in'
        });
    });

    // Flash and reveal portfolio
    setTimeout(() => {
        const flash = sceneTransform.querySelector('.transform-flash');
        gsap.to(flash, {
            opacity: 1, duration: 0.15,
            onComplete: () => {
                gsap.to(flash, { opacity: 0, duration: 0.5 });
            }
        });

        setTimeout(() => {
            sceneTransform.classList.add('hidden');
            portfolio.classList.remove('hidden');
            currentScene = 'portfolio';
            document.body.style.overflow = 'auto';
            initPortfolio();
        }, 400);
    }, 3200);
}

// =============================================
// PORTFOLIO — INIT & SCROLL ANIMATIONS
// =============================================
function initPortfolio() {
    // Show nav
    setTimeout(() => mainNav.classList.add('visible'), 300);

    gsap.registerPlugin(ScrollTrigger);

    // Hero animations
    gsap.from('.hero-badge', { opacity: 0, y: 30, duration: 0.8, delay: 0.2 });
    gsap.from('.hero-greeting', { opacity: 0, y: 30, duration: 0.8, delay: 0.4 });
    gsap.from('.hero-name', { opacity: 0, y: 40, duration: 1, delay: 0.6 });
    gsap.from('.hero-roles', { opacity: 0, y: 30, duration: 0.8, delay: 0.8 });
    gsap.from('.hero-description', { opacity: 0, y: 30, duration: 0.8, delay: 1.0 });
    gsap.from('.hero-cta', { opacity: 0, y: 30, duration: 0.8, delay: 1.2 });

    // About section
    gsap.from('.about-image-frame', {
        scrollTrigger: { trigger: '#about', start: 'top 80%' },
        opacity: 0, x: -60, duration: 1
    });
    gsap.from('.about-content', {
        scrollTrigger: { trigger: '#about', start: 'top 80%' },
        opacity: 0, x: 60, duration: 1, delay: 0.2
    });
    gsap.from('.about-float-card', {
        scrollTrigger: { trigger: '#about', start: 'top 80%' },
        opacity: 0, scale: 0, duration: 0.6, delay: 0.5, stagger: 0.2
    });

    // Stat counter animation
    ScrollTrigger.create({
        trigger: '.about-stats',
        start: 'top 85%',
        once: true,
        onEnter: () => animateCounters('.stat-number')
    });

    // Skills section - animate bars
    ScrollTrigger.create({
        trigger: '#skills',
        start: 'top 75%',
        once: true,
        onEnter: () => {
            $$('.skill-bar-item').forEach(el => {
                const pct = el.dataset.skill;
                const fill = el.querySelector('.skill-fill');
                fill.style.width = pct + '%';
            });
        }
    });

    gsap.from('.skill-category', {
        scrollTrigger: { trigger: '#skills', start: 'top 80%' },
        opacity: 0, y: 50, duration: 0.8, stagger: 0.3
    });

    // Projects
    gsap.from('.project-card', {
        scrollTrigger: { trigger: '#projects', start: 'top 80%' },
        opacity: 0, y: 60, duration: 0.8, stagger: 0.2
    });

    // Studio section
    gsap.from('.studio-content', {
        scrollTrigger: { trigger: '#video-studio', start: 'top 70%' },
        opacity: 0, y: 60, duration: 1
    });
    ScrollTrigger.create({
        trigger: '.studio-stats',
        start: 'top 85%',
        once: true,
        onEnter: () => animateCounters('.studio-stat-num')
    });

    // Contact section
    gsap.from('.contact-info', {
        scrollTrigger: { trigger: '#contact', start: 'top 80%' },
        opacity: 0, x: -40, duration: 0.8
    });
    gsap.from('.contact-form', {
        scrollTrigger: { trigger: '#contact', start: 'top 80%' },
        opacity: 0, x: 40, duration: 0.8, delay: 0.2
    });

    // Section headers
    $$('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: { trigger: header, start: 'top 85%' },
            opacity: 0, y: 40, duration: 0.8
        });
    });

    // Nav active link on scroll
    const sections = ['hero', 'about', 'skills', 'projects', 'video-studio', 'contact'];
    sections.forEach(id => {
        ScrollTrigger.create({
            trigger: '#' + id,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => setActiveNav(id),
            onEnterBack: () => setActiveNav(id),
        });
    });

    // Parallax effect on hero bg
    gsap.to('.hero-bg-image', {
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
        y: 150, scale: 1.1
    });

    // Init mobile menu
    initMobileMenu();

    // Contact form handler
    initContactForm();
}

function setActiveNav(id) {
    $$('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
}

function animateCounters(selector) {
    $$(selector).forEach(el => {
        const target = parseInt(el.dataset.target);
        let current = 0;
        const increment = target / 40;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.round(current);
        }, 40);
    });
}

function initMobileMenu() {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
    });
    $$('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('open');
        });
    });
}

function initContactForm() {
    const form = $('#contactForm');
    const WHATSAPP_NUMBER = '919030777230';
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#formName').value;
        const email = $('#formEmail').value;
        const subject = $('#formSubject').value;
        const message = $('#formMessage').value;
        const fullMessage = `*New Portfolio Message*\n\n*Name:* ${name}\n*Email:* ${email}\n*Subject:* ${subject}\n*Message:* ${message}`;
        const whatsappURL = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(fullMessage);
        const btn = form.querySelector('.form-submit');
        btn.innerHTML = '<span>Redirecting to WhatsApp...</span>';
        btn.style.background = 'linear-gradient(135deg, #27c93f, #2ecc71)';
        setTimeout(() => {
            window.open(whatsappURL, '_blank');
            btn.innerHTML = '<span>Send Message</span><i class="fas fa-paper-plane"></i><div class="btn-glow"></div>';
            btn.style.background = '';
            form.reset();
        }, 800);
    });
}

// =============================================
// SMOOTH SCROLL FOR NAV LINKS
// =============================================
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link && currentScene === 'portfolio') {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

// =============================================
// INITIALIZATION
// =============================================
window.addEventListener('DOMContentLoaded', () => {
    document.body.style.overflow = 'hidden';
    generateKeyboard();
    initThreeBackground();
    initCursor();
    initDoorScene();
    initEnterButton();
    runLoader();
});
