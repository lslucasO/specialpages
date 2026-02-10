(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CONTACT_EMAIL = "lslucaslemos@gmail.com";
  const THEME_STORAGE_KEY = "specialpages-theme";

  function applyTheme(theme) {
    const root = document.documentElement;
    const normalizedTheme = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", normalizedTheme);

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      const toLight = normalizedTheme === "dark";
      themeToggle.textContent = toLight ? "Modo claro" : "Modo escuro";
      themeToggle.setAttribute("aria-label", toLight ? "Ativar modo claro" : "Ativar modo escuro");
      themeToggle.setAttribute("aria-pressed", String(normalizedTheme === "light"));
    }

    window.dispatchEvent(new Event("themechange"));
  }

  function initThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    let storedTheme = "";

    try {
      storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) || "";
    } catch (error) {
      storedTheme = "";
    }

    applyTheme(storedTheme === "light" ? "light" : "dark");

    if (!themeToggle) return;
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (error) {
        // no-op when storage is unavailable
      }
    });
  }

  function initMenu() {
    const topbar = document.querySelector(".topbar");
    const toggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelectorAll(".topbar nav a");

    if (!topbar || !toggle) return;

    toggle.addEventListener("click", () => {
      const isOpen = topbar.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (!topbar.classList.contains("nav-open")) return;
        topbar.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -30px" }
    );

    items.forEach((item) => observer.observe(item));
  }

  function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    function runCounter(node) {
      const target = Number(node.dataset.counter || 0);
      const duration = 1400;
      let start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        node.textContent = String(Math.floor(progress * target));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          node.textContent = String(target);
        }
      }

      window.requestAnimationFrame(step);
    }

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      counters.forEach((counter) => {
        counter.textContent = counter.dataset.counter || "0";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.55 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  function initTilt() {
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll("[data-tilt]");
    cards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", `${(x * 8).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(-y * 8).toFixed(2)}deg`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  function initHeroPointer() {
    const stage = document.getElementById("hero-stage");
    const glowOne = document.querySelector(".hero-glow--one");
    const glowTwo = document.querySelector(".hero-glow--two");
    if (!stage || prefersReducedMotion) return;

    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      if (glowOne) glowOne.style.transform = `translate(${x * 44}px, ${y * 30}px)`;
      if (glowTwo) glowTwo.style.transform = `translate(${-x * 34}px, ${-y * 26}px)`;
    });

    stage.addEventListener("pointerleave", () => {
      if (glowOne) glowOne.style.transform = "translate(0, 0)";
      if (glowTwo) glowTwo.style.transform = "translate(0, 0)";
    });
  }

  function initHeroCanvas() {
    const canvas = document.getElementById("hero-canvas");
    const host = document.getElementById("hero-stage");
    if (!canvas || !host || prefersReducedMotion) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let time = 0;
    let canvasWaveRgb = "255, 255, 255";
    let canvasOverlayRgb = "56, 194, 169";
    const waves = [];

    function syncCanvasTheme() {
      const styles = window.getComputedStyle(document.documentElement);
      canvasWaveRgb = styles.getPropertyValue("--canvas-wave-rgb").trim() || "255, 255, 255";
      canvasOverlayRgb = styles.getPropertyValue("--canvas-overlay-rgb").trim() || "56, 194, 169";
    }

    function createWaves() {
      waves.length = 0;
      const total = 4;
      for (let index = 0; index < total; index += 1) {
        waves.push({
          amplitude: 16 + index * 8,
          length: 160 + index * 56,
          speed: 0.012 + index * 0.004,
          y: height * (0.3 + index * 0.16),
          opacity: 0.16 + index * 0.07,
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createWaves();
    }

    function drawWave(wave, phase) {
      context.beginPath();
      for (let x = 0; x <= width; x += 6) {
        const y = wave.y + Math.sin((x + phase) / wave.length) * wave.amplitude;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.strokeStyle = `rgba(${canvasWaveRgb}, ${wave.opacity})`;
      context.lineWidth = 1.2;
      context.stroke();
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `rgba(${canvasOverlayRgb}, 0.14)`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      time += 1;
      waves.forEach((wave, index) => {
        const phase = time * (20 * wave.speed) + index * 120;
        drawWave(wave, phase);
      });

      frameId = window.requestAnimationFrame(draw);
    }

    function cleanup() {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("beforeunload", cleanup);
      window.removeEventListener("themechange", syncCanvasTheme);
    }

    syncCanvasTheme();
    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("themechange", syncCanvasTheme);
    window.addEventListener("beforeunload", cleanup);
  }

  function initSceneDepth() {
    if (prefersReducedMotion) return;

    const scenes = document.querySelectorAll("[data-scene]");
    scenes.forEach((scene) => {
      const shapes = scene.querySelectorAll("[data-shape]");
      if (!shapes.length) return;

      scene.addEventListener("pointermove", (event) => {
        const rect = scene.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        shapes.forEach((shape) => {
          const depth = Number(shape.dataset.depth || 10);
          const px = (-x * depth).toFixed(2);
          const py = (-y * depth).toFixed(2);
          shape.style.setProperty("--px", `${px}px`);
          shape.style.setProperty("--py", `${py}px`);
        });
      });

      scene.addEventListener("pointerleave", () => {
        shapes.forEach((shape) => {
          shape.style.setProperty("--px", "0px");
          shape.style.setProperty("--py", "0px");
        });
      });
    });
  }

  function initContactForm() {
    const form = document.getElementById("contact-form");
    const message = document.getElementById("form-message");
    if (!form || !message) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!CONTACT_EMAIL || CONTACT_EMAIL.includes("contato@specialpages.com")) {
        message.textContent = "Atualize o e-mail de destino no arquivo script.js (CONTACT_EMAIL).";
        return;
      }

      const data = new FormData(form);
      const nome = String(data.get("nome") || "");
      const email = String(data.get("email") || "");
      const tipo = String(data.get("tipo") || "");
      const mensagem = String(data.get("mensagem") || "");

      const subject = `Novo projeto SpecialPages - ${nome}`;
      const body =
        `Nome: ${nome}\n` +
        `Email: ${email}\n` +
        `Tipo de pagina: ${tipo}\n\n` +
        `Objetivo:\n${mensagem}`;

      const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      message.textContent = "Abrindo seu aplicativo de e-mail...";
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initMenu();
    initReveal();
    initCounters();
    initTilt();
    initHeroPointer();
    initHeroCanvas();
    initSceneDepth();
    initContactForm();
  });
})();
