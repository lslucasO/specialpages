(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prefersReducedData = typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData === true;
  const shouldReduceEffects =
    prefersReducedMotion ||
    prefersReducedData ||
    document.documentElement.classList.contains("mobile-optimized");
  const THEME_STORAGE_KEY = "specialpages-theme";
  const THEME_MANUAL_STORAGE_KEY = "specialpages-theme-manual";
  const THEME_META_COLORS = {
    dark: "#060B14",
    light: "#F7FAFF",
  };

  function readStoredTheme() {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function hasManualThemePreference() {
    try {
      return window.localStorage.getItem(THEME_MANUAL_STORAGE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function writeStoredTheme(theme) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      window.localStorage.setItem(THEME_MANUAL_STORAGE_KEY, "1");
    } catch (error) {
      // no-op when storage is unavailable
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const normalizedTheme = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", normalizedTheme);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", THEME_META_COLORS[normalizedTheme]);
    }

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
    const storedTheme = readStoredTheme();
    const hasManualTheme = hasManualThemePreference();
    const rootTheme = document.documentElement.getAttribute("data-theme");
    const hasStoredTheme = hasManualTheme && (storedTheme === "light" || storedTheme === "dark");
    const initialTheme = hasStoredTheme
      ? storedTheme
      : rootTheme === "light" || rootTheme === "dark"
      ? rootTheme
      : "light";

    applyTheme(initialTheme);

    if (!themeToggle) return;
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      writeStoredTheme(nextTheme);
    });
  }

  function initSiteLoader() {
    const body = document.body;
    const loader = document.getElementById("site-loader");
    if (!body) return;

    if (!loader) {
      body.classList.remove("is-loading");
      return;
    }

    const minVisibleTime = shouldReduceEffects ? 220 : 960;
    const fadeDuration = shouldReduceEffects ? 0 : 460;
    const getNow = () =>
      window.performance && typeof window.performance.now === "function"
        ? window.performance.now()
        : Date.now();
    const startTime = getNow();
    let hasScheduledExit = false;
    let hasExited = false;

    const removeLoader = () => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    };

    const exitLoader = () => {
      if (hasExited) return;
      hasExited = true;
      body.classList.remove("is-loading");
      loader.classList.add("is-leaving");

      if (fadeDuration === 0) {
        removeLoader();
        return;
      }

      window.setTimeout(removeLoader, fadeDuration + 80);
    };

    const scheduleExit = () => {
      if (hasScheduledExit) return;
      hasScheduledExit = true;

      const elapsed = getNow() - startTime;
      const waitTime = Math.max(0, minVisibleTime - elapsed);
      window.setTimeout(exitLoader, waitTime);
    };

    if (document.readyState === "complete") {
      scheduleExit();
      return;
    }

    window.addEventListener("load", scheduleExit, { once: true });
    window.setTimeout(scheduleExit, shouldReduceEffects ? 600 : 2400);
  }

  function initMenu() {
    const topbar = document.querySelector(".topbar");
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".topbar nav");
    const navLinks = document.querySelectorAll(".topbar nav a");

    if (!topbar || !toggle || !nav) return;

    function setMenuState(isOpen) {
      topbar.classList.toggle("nav-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("nav-lock", isOpen && window.matchMedia("(max-width: 900px)").matches);
    }

    toggle.addEventListener("click", () => {
      const nextState = !topbar.classList.contains("nav-open");
      setMenuState(nextState);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (!topbar.classList.contains("nav-open")) return;
        setMenuState(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !topbar.classList.contains("nav-open")) return;
      setMenuState(false);
    });

    document.addEventListener(
      "pointerdown",
      (event) => {
        if (!topbar.classList.contains("nav-open")) return;
        if (topbar.contains(event.target)) return;
        setMenuState(false);
      },
      { passive: true }
    );

    const desktopQuery = window.matchMedia("(min-width: 881px)");
    const handleDesktopChange = (event) => {
      if (!event.matches) return;
      setMenuState(false);
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleDesktopChange);
    }
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (shouldReduceEffects || !("IntersectionObserver" in window)) {
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

    if (shouldReduceEffects || !("IntersectionObserver" in window)) {
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

  function initMetricsChartInteractivity() {
    const chart = document.querySelector(".metrics__chart");
    if (!chart) return;

    const detail = document.getElementById("metrics-chart-detail");
    const months = Array.from(chart.querySelectorAll(".metrics__month"));
    if (!months.length) return;

    const getBarValue = (bar) => {
      const inlineValue = bar.style.getPropertyValue("--bar-value");
      const rawValue = inlineValue || window.getComputedStyle(bar).getPropertyValue("--bar-value");
      const parsedValue = Number.parseFloat(rawValue);
      return Number.isFinite(parsedValue) ? parsedValue : 0;
    };

    const formatValue = (value) => Number(value).toLocaleString("pt-BR");

    const clearSelection = () => {
      months.forEach((month) => {
        month.classList.remove("is-selected");
        month.querySelectorAll(".metrics__bar").forEach((bar) => {
          bar.classList.remove("is-selected", "is-context");
          bar.setAttribute("aria-pressed", "false");
        });
      });
    };

    const activateBar = (bar, shouldFocus = false) => {
      const month = bar.closest(".metrics__month");
      if (!month) return;

      const monthLabel = month.querySelector(".metrics__month-label")?.textContent?.trim() || "Mês";
      const baseBar = month.querySelector(".metrics__bar--base");
      const siteBar = month.querySelector(".metrics__bar--site");
      if (!baseBar || !siteBar) return;

      const baseValue = getBarValue(baseBar);
      const siteValue = getBarValue(siteBar);
      const isSiteBar = bar.classList.contains("metrics__bar--site");
      const selectedSeries = isSiteBar ? "Com site profissional" : "Sem site estruturado";
      const selectedValue = isSiteBar ? siteValue : baseValue;
      const gain = siteValue - baseValue;
      const gainPercent = baseValue > 0 ? Math.round((gain / baseValue) * 100) : 0;
      const gainPrefix = gain >= 0 ? "+" : "-";
      const gainPercentPrefix = gainPercent >= 0 ? "+" : "-";

      clearSelection();
      month.classList.add("is-selected");
      bar.classList.add("is-selected");
      bar.setAttribute("aria-pressed", "true");

      const contextBar = isSiteBar ? baseBar : siteBar;
      contextBar.classList.add("is-context");

      if (detail) {
        detail.textContent =
          `${monthLabel} selecionado. ${selectedSeries}: ${formatValue(selectedValue)}. ` +
          `Sem site: ${formatValue(baseValue)} | Com site: ${formatValue(siteValue)}. ` +
          `Diferença: ${gainPrefix}${formatValue(Math.abs(gain))} (${gainPercentPrefix}${Math.abs(gainPercent)}%).`;
      }

      if (shouldFocus) {
        bar.focus();
      }
    };

    months.forEach((month) => {
      const monthLabel = month.querySelector(".metrics__month-label")?.textContent?.trim() || "Mês";
      const baseBar = month.querySelector(".metrics__bar--base");
      const siteBar = month.querySelector(".metrics__bar--site");
      if (!baseBar || !siteBar) return;

      const setupBar = (bar, seriesLabel) => {
        const value = getBarValue(bar);
        bar.dataset.valueLabel = formatValue(value);
        bar.setAttribute("tabindex", "0");
        bar.setAttribute("role", "button");
        bar.setAttribute("aria-pressed", "false");
        bar.setAttribute("aria-label", `${monthLabel}: ${seriesLabel}, ${formatValue(value)} oportunidades`);
        bar.title = `${monthLabel} - ${seriesLabel}: ${formatValue(value)}`;

        bar.addEventListener("click", () => activateBar(bar));
        bar.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          activateBar(bar, true);
        });
      };

      setupBar(baseBar, "Sem site estruturado");
      setupBar(siteBar, "Com site profissional");

      month.addEventListener("click", (event) => {
        if (event.target.closest(".metrics__bar")) return;
        activateBar(siteBar);
      });
    });

    const firstSiteBar = chart.querySelector(".metrics__month .metrics__bar--site");
    if (firstSiteBar) {
      activateBar(firstSiteBar);
    }
  }

  function initTilt() {
    if (shouldReduceEffects) return;

    const cards = document.querySelectorAll("[data-tilt]");
    cards.forEach((card) => {
      let frameId = 0;
      let nextX = 0;
      let nextY = 0;

      const applyTilt = () => {
        card.style.setProperty("--tilt-x", `${(nextX * 8).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(-nextY * 8).toFixed(2)}deg`);
        frameId = 0;
      };

      card.addEventListener(
        "pointermove",
        (event) => {
          const rect = card.getBoundingClientRect();
          nextX = (event.clientX - rect.left) / rect.width - 0.5;
          nextY = (event.clientY - rect.top) / rect.height - 0.5;

          if (frameId) return;
          frameId = window.requestAnimationFrame(applyTilt);
        },
        { passive: true }
      );

      card.addEventListener("pointerleave", () => {
        if (frameId) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        }

        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  function initHeroPointer() {
    const stage = document.getElementById("hero-stage");
    const glowOne = document.querySelector(".hero-glow--one");
    const glowTwo = document.querySelector(".hero-glow--two");
    if (!stage || shouldReduceEffects) return;

    let frameId = 0;
    let nextX = 0;
    let nextY = 0;

    const applyGlow = () => {
      if (glowOne) glowOne.style.transform = `translate(${nextX * 44}px, ${nextY * 30}px)`;
      if (glowTwo) glowTwo.style.transform = `translate(${-nextX * 34}px, ${-nextY * 26}px)`;
      frameId = 0;
    };

    stage.addEventListener(
      "pointermove",
      (event) => {
        const rect = stage.getBoundingClientRect();
        nextX = (event.clientX - rect.left) / rect.width - 0.5;
        nextY = (event.clientY - rect.top) / rect.height - 0.5;

        if (frameId) return;
        frameId = window.requestAnimationFrame(applyGlow);
      },
      { passive: true }
    );

    stage.addEventListener("pointerleave", () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      if (glowOne) glowOne.style.transform = "translate(0, 0)";
      if (glowTwo) glowTwo.style.transform = "translate(0, 0)";
    });
  }

  function initHeroCanvas() {
    const canvas = document.getElementById("hero-canvas");
    const host = document.getElementById("hero-stage");
    if (!canvas || !host || shouldReduceEffects) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let resizeFrameId = 0;
    let time = 0;
    let canvasWaveRgb = "255, 255, 255";
    let canvasOverlayRgb = "56, 194, 169";
    let isRunning = false;
    let inViewport = true;
    let pageVisible = !document.hidden;
    let observer = null;
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
          amplitude: 12 + index * 7,
          length: 150 + index * 54,
          speed: 0.011 + index * 0.0038,
          y: height * (0.3 + index * 0.16),
          opacity: 0.14 + index * 0.065,
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createWaves();
    }

    function requestResize() {
      if (resizeFrameId) return;
      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = 0;
        resize();
      });
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
      context.lineWidth = 1.1;
      context.stroke();
    }

    function draw() {
      if (!isRunning) return;

      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `rgba(${canvasOverlayRgb}, 0.12)`);
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

    function start() {
      if (isRunning || !inViewport || !pageVisible) return;
      isRunning = true;
      frameId = window.requestAnimationFrame(draw);
    }

    function stop() {
      if (!isRunning) return;
      isRunning = false;
      window.cancelAnimationFrame(frameId);
    }

    function handleVisibilityChange() {
      pageVisible = !document.hidden;
      if (pageVisible) {
        start();
      } else {
        stop();
      }
    }

    function cleanup() {
      stop();
      if (resizeFrameId) window.cancelAnimationFrame(resizeFrameId);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", requestResize);
      window.removeEventListener("beforeunload", cleanup);
      window.removeEventListener("themechange", syncCanvasTheme);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }

    syncCanvasTheme();
    resize();

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          inViewport = Boolean(entry && entry.isIntersecting);
          if (inViewport) {
            start();
          } else {
            stop();
          }
        },
        { threshold: 0.08 }
      );
      observer.observe(host);
    }

    start();

    window.addEventListener("resize", requestResize, { passive: true });
    window.addEventListener("themechange", syncCanvasTheme);
    window.addEventListener("beforeunload", cleanup);
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  function initSceneDepth() {
    if (shouldReduceEffects) return;

    const scenes = document.querySelectorAll("[data-scene]");
    scenes.forEach((scene) => {
      const shapes = scene.querySelectorAll("[data-shape]");
      if (!shapes.length) return;

      let frameId = 0;
      let pointerX = 0;
      let pointerY = 0;

      const applyDepth = () => {
        shapes.forEach((shape) => {
          const depth = Number(shape.dataset.depth || 10);
          const px = (-pointerX * depth).toFixed(2);
          const py = (-pointerY * depth).toFixed(2);
          shape.style.setProperty("--px", `${px}px`);
          shape.style.setProperty("--py", `${py}px`);
        });

        frameId = 0;
      };

      scene.addEventListener(
        "pointermove",
        (event) => {
          const rect = scene.getBoundingClientRect();
          pointerX = (event.clientX - rect.left) / rect.width - 0.5;
          pointerY = (event.clientY - rect.top) / rect.height - 0.5;

          if (frameId) return;
          frameId = window.requestAnimationFrame(applyDepth);
        },
        { passive: true }
      );

      scene.addEventListener("pointerleave", () => {
        if (frameId) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        }

        shapes.forEach((shape) => {
          shape.style.setProperty("--px", "0px");
          shape.style.setProperty("--py", "0px");
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.toggle("mobile-optimized", shouldReduceEffects);

    initSiteLoader();
    initThemeToggle();
    initMenu();
    initReveal();
    initCounters();
    initMetricsChartInteractivity();
    initTilt();
    initHeroPointer();
    initHeroCanvas();
    initSceneDepth();
  });
})();
