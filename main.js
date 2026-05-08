/* ══════════════════════════════════════════════════
   Chiyu Neko — Neko-OS Portfolio
   main.js
   ══════════════════════════════════════════════════ */

/* ── Quest Log Tab Filtering ── */
function initQuestTabs() {
    const tabs  = document.querySelectorAll('.quest-tab');
    const items = document.querySelectorAll('.quest-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('tab-active');
                t.classList.add('tab-inactive');
            });
            tab.classList.add('tab-active');
            tab.classList.remove('tab-inactive');

            const filter = tab.dataset.filter;
            items.forEach(item => {
                item.style.display =
                    (filter === 'all' || item.dataset.status === filter) ? '' : 'none';
            });
        });
    });
}

/* ── Inventory Slot Click → Lightbox ── */
function initInventoryLightbox() {
    const slots   = document.querySelectorAll('.inv-slot:not(.empty)');
    const overlay = document.getElementById('lightbox-overlay');
    if (!overlay) return;

    const imgEl   = document.getElementById('lightbox-img');
    const nameEl  = document.getElementById('lightbox-name');
    const noteEl  = document.getElementById('lightbox-note');
    const closeEl = document.getElementById('lightbox-close');

    slots.forEach(slot => {
        slot.addEventListener('click', () => {
            const name  = slot.dataset.name  || slot.querySelector('.inv-name')?.textContent || '';
            const note  = slot.dataset.note  || slot.querySelector('.inv-year')?.textContent || '';
            const image = slot.dataset.image || '';
            nameEl.textContent          = name;
            noteEl.textContent          = note;
            imgEl.src                   = image;
            imgEl.alt                   = name;
            imgEl.style.display         = image ? 'block' : 'none';
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeLightbox() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    closeEl?.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

/* ── Scroll-spy nav highlight ── */
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id], div[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.style.color = '';
                    if (link.getAttribute('href') === '#' + entry.target.id) {
                        link.style.color = 'var(--orange)';
                    }
                });
            }
        });
    }, { threshold: 0.35 });

    sections.forEach(s => observer.observe(s));
}

/* ── Skill node hover ── */
function initSkillTooltips() {
    document.querySelectorAll('.skill-node').forEach(node => {
        if (node.hasAttribute('data-always-active')) return;
        node.addEventListener('mouseenter', () => node.classList.add('active'));
        node.addEventListener('mouseleave', () => node.classList.remove('active'));
    });
}

/* ══════════════════════════════════════════════════
   CONTACT FORM — Formspree
   ──────────────────────────────────────────────────
   Submits to Formspree via fetch (no page redirect).
   Shows inline field errors, a loading state on the
   button, and a branded success screen on completion.
   ══════════════════════════════════════════════════ */
function initContactForm() {
    const form         = document.getElementById('contact-form');
    const submitBtn    = document.getElementById('submit-btn');
    const formDefault  = document.getElementById('form-default');
    const formSuccess  = document.getElementById('form-success');
    const sendAgainBtn = document.getElementById('send-another-btn');
    const globalError  = document.getElementById('form-global-error');

    if (!form) return;

    /* ── Field validators — return error string or empty string ── */
    const validators = {
        'contact-name':    v => v.length >= 2                             ? '' : 'Please enter your name.',
        'contact-email':   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)    ? '' : 'Please enter a valid email address.',
        'contact-subject': v => v.length >= 3                             ? '' : 'Please add a subject.',
        'contact-message': v => v.length >= 10                            ? '' : 'Message must be at least 10 characters.',
    };

    function validateField(id) {
        const input    = document.getElementById(id);
        const errEl    = document.getElementById('err-' + id.replace('contact-', ''));
        const errorMsg = validators[id](input.value.trim());

        if (errorMsg) {
            input.classList.add('input-error');
            input.classList.remove('input-valid');
            if (errEl) errEl.textContent = errorMsg;
        } else {
            input.classList.remove('input-error');
            input.classList.add('input-valid');
            if (errEl) errEl.textContent = '';
        }
        return !errorMsg;
    }

    /* Show errors on blur; clear as user fixes them */
    Object.keys(validators).forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('blur',  () => validateField(id));
        input.addEventListener('input', () => {
            if (input.classList.contains('input-error')) validateField(id);
        });
    });

    /* ── Submit handler ── */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        /* Run all validators; stop if any fail */
        const allValid = Object.keys(validators).map(id => validateField(id)).every(Boolean);
        if (!allValid) return;

        /* Loading state */
        submitBtn.disabled      = true;
        submitBtn.textContent   = '🐾 Sending…';
        submitBtn.style.opacity = '0.75';
        globalError.style.display = 'none';

        try {
            const response = await fetch(form.action, {
                method:  'POST',
                headers: { 'Accept': 'application/json' },
                body:    new FormData(form),
            });

            if (response.ok) {
                /* ── Success: swap to the thank-you screen ── */
                formDefault.style.display = 'none';
                formSuccess.style.display = 'block';
                form.reset();
                Object.keys(validators).forEach(id => {
                    const input = document.getElementById(id);
                    if (input) input.classList.remove('input-error', 'input-valid');
                });
            } else {
                /* Formspree returned an HTTP error */
                const data = await response.json().catch(() => ({}));
                console.error('Formspree error:', data);
                globalError.style.display = 'block';
                resetButton();
            }
        } catch (err) {
            /* Network failure */
            console.error('Network error:', err);
            globalError.style.display = 'block';
            resetButton();
        }
    });

    function resetButton() {
        submitBtn.disabled      = false;
        submitBtn.textContent   = '🐾 Send Whisper';
        submitBtn.style.opacity = '';
    }

    /* ── "Send Another" resets back to the form ── */
    sendAgainBtn?.addEventListener('click', () => {
        formSuccess.style.display = 'none';
        formDefault.style.display = 'block';
        document.getElementById('contact-name')?.focus();
    });
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
    initQuestTabs();
    initInventoryLightbox();
    initScrollSpy();
    initSkillTooltips();
    initContactForm();
});
