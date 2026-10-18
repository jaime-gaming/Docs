/**
 * Interacciones de la documentación.
 *
 * Hereda de la web principal: barra de progreso de lectura, revelado
 * por IntersectionObserver, menú burger, botón de subir y el foco que
 * sigue al puntero en las tarjetas. Añade lo propio de un sitio de docs:
 * sidebar deslizable en móvil, scrollspy del índice "en esta página",
 * copia de bloques de código y anclas en los encabezados.
 *
 * Todo respeta prefers-reduced-motion y funciona sin JavaScript
 * (el contenido está en el HTML servido).
 */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedMotionQuery.matches;
  reducedMotionQuery.addEventListener?.("change", (event) => { reducedMotion = event.matches; });

  const getLang = () => window.currentLang || document.documentElement.lang || "es";

  function textFor(key, fallback = "") {
    return window.i18n?.dict?.[getLang()]?.[key] || fallback;
  }

  function iconHtml(name) {
    const base = document.body.dataset.icons || "icons.svg";
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${base}#icon-${name}"></use></svg>`;
  }

  /* ---------- Barra de progreso de lectura ---------- */
  const progressBar = document.getElementById("progressBar");
  function updateProgress() {
    if (!progressBar) return;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0;
    progressBar.style.setProperty("--progress", ratio.toFixed(4));
  }

  /* ---------- Revelado al entrar en pantalla ---------- */
  let revealObserver = null;
  function observeReveals(root = document) {
    const items = [];
    if (root.matches?.(".reveal:not(.in-view)")) items.push(root);
    items.push(...root.querySelectorAll(".reveal:not(.in-view)"));
    if (!items.length) return;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("in-view"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -2% 0px" });
    }
    items.forEach((item) => revealObserver.observe(item));
  }

  /** Retraso escalonado, como en la portada de la web principal. */
  function setStaggerDelays() {
    document.querySelectorAll("[data-stagger]").forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        child.style.animationDelay = `${Math.min(index, 8) * 45}ms`;
      });
    });
  }

  /* ---------- Foco radial que sigue al puntero ---------- */
  function bindSpotlights() {
    if (reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.querySelectorAll(".doc-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
      }, { passive: true });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--pointer-x", "50%");
        card.style.setProperty("--pointer-y", "50%");
      }, { passive: true });
    });
  }

  /* ---------- Menú burger ---------- */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  burger?.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    burger.setAttribute("aria-label", textFor(open ? "nav.openMenu" : "nav.closeMenu", open ? "Abrir menú" : "Cerrar menú"));
    mobileMenu?.classList.toggle("open", !open);
  });

  /* ---------- Sidebar deslizable en móvil ---------- */
  const sidebar = document.getElementById("docsSidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  let sidebarScrim = null;

  function setSidebar(open) {
    if (!sidebar) return;
    sidebar.classList.toggle("open", open);
    sidebarToggle?.setAttribute("aria-expanded", String(open));
    sidebarToggle?.setAttribute(
      "aria-label",
      textFor(open ? "aria.closeSidebar" : "aria.openSidebar", open ? "Cerrar índice" : "Abrir índice")
    );
    if (open) {
      if (!sidebarScrim) {
        sidebarScrim = document.createElement("div");
        sidebarScrim.className = "sidebar-scrim";
        sidebarScrim.addEventListener("click", () => setSidebar(false));
        document.body.append(sidebarScrim);
      }
      sidebar.querySelector(".side-nav__link.active")?.scrollIntoView({ block: "nearest" });
    } else {
      sidebarScrim?.remove();
      sidebarScrim = null;
    }
  }

  if (sidebarToggle) {
    sidebarToggle.innerHTML = `${iconHtml("panel")}<span data-i18n="docs.jumpTo">Ir a</span>`;
    sidebarToggle.addEventListener("click", () => setSidebar(!sidebar.classList.contains("open")));
    // Al navegar desde el sidebar en móvil, cerrarlo.
    sidebar.addEventListener("click", (event) => {
      if (event.target.closest("a") && window.innerWidth <= 860) setSidebar(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) setSidebar(false);
    });
  }

  /* ---------- Anclas en encabezados y copiado de código ---------- */
  const docBody = document.querySelector(".doc-body");

  function decorateHeadings() {
    if (!docBody) return;
    docBody.querySelectorAll("h2[id], h3[id]").forEach((heading) => {
      if (heading.querySelector(".anchor")) return;
      const anchor = document.createElement("a");
      anchor.className = "anchor";
      anchor.href = `#${heading.id}`;
      anchor.textContent = "#";
      anchor.setAttribute("aria-hidden", "true");
      anchor.tabIndex = -1;
      heading.append(anchor);
    });
  }

  function decorateCode() {
    if (!docBody) return;
    docBody.querySelectorAll("pre").forEach((block) => {
      const code = block.querySelector("code");
      const lang = (code?.className.match(/language-(\w+)/) || [])[1];
      if (lang) block.dataset.lang = lang;
      if (block.querySelector(".code-copy")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.innerHTML = iconHtml("copy");
      button.setAttribute("aria-label", textFor("code.copy", "Copiar"));
      button.addEventListener("click", async () => {
        const text = (code || block).innerText;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Portapapeles no disponible: selección manual como respaldo.
          const area = document.createElement("textarea");
          area.value = text;
          area.setAttribute("readonly", "");
          area.style.cssText = "position:absolute;left:-9999px";
          document.body.append(area);
          area.select();
          try { document.execCommand("copy"); } catch { /* sin copiado */ }
          area.remove();
        }
        button.dataset.done = "true";
        button.innerHTML = iconHtml("check");
        button.setAttribute("aria-label", textFor("code.copied", "Copiado"));
        window.setTimeout(() => {
          delete button.dataset.done;
          button.innerHTML = iconHtml("copy");
          button.setAttribute("aria-label", textFor("code.copy", "Copiar"));
        }, 1800);
      });
      block.append(button);
    });
  }

  /** Tablas anchas: envolverlas para poder desplazarlas sin romper el layout. */
  function wrapTables() {
    docBody?.querySelectorAll("table").forEach((table) => {
      if (table.parentElement.classList.contains("doc-table")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "doc-table";
      table.before(wrapper);
      wrapper.append(table);
    });
  }

  /* ---------- Scrollspy del índice "en esta página" ---------- */
  const tocLinks = Array.from(document.querySelectorAll(".toc__list a"));
  let spyObserver = null;

  function initScrollspy() {
    if (!tocLinks.length) return;
    const headings = tocLinks
      .map((link) => document.getElementById(decodeURIComponent(link.getAttribute("href").slice(1))))
      .filter(Boolean);
    if (!headings.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const visible = new Set();
    spyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      const current = headings.find((heading) => visible.has(heading.id))
        || headings.filter((h) => h.getBoundingClientRect().top < 140).pop();
      if (!current) return;
      tocLinks.forEach((link) => {
        link.classList.toggle("active", decodeURIComponent(link.getAttribute("href").slice(1)) === current.id);
      });
    }, { rootMargin: "-88px 0px -65% 0px", threshold: [0, 1] });

    headings.forEach((heading) => spyObserver.observe(heading));
  }

  /* ---------- Barra de progreso lateral del TOC ---------- */
  function updateTocProgress() {
    const marker = document.querySelector(".toc__progress span");
    const body = document.querySelector(".doc-body");
    if (!marker || !body) return;
    const total = body.querySelectorAll("h2[id]").length;
    if (!total) return;
    let done = 0;
    body.querySelectorAll("h2[id]").forEach((heading) => {
      if (heading.getBoundingClientRect().top < 140) done += 1;
    });
    marker.textContent = `${String(done).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  }

  /* ---------- Botón de volver arriba ---------- */
  const toTop = document.getElementById("toTop");
  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });

  /* ---------- Enlace activo del sidebar según la ruta ---------- */
  function markActiveNav() {
    const path = document.body.dataset.path || window.location.pathname;
    document.querySelectorAll(".side-nav__link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const base = document.querySelector('meta[name="docs:base"]')?.content || "/";
      const linkPath = href.startsWith(base) ? "/" + href.slice(base.length) : href;
      link.classList.toggle("active", linkPath === path || linkPath === `${path.replace(/\/$/, "")}/`);
    });
  }

  /* ---------- Filtros del índice de proyectos ---------- */
  function initFilters() {
    const chips = Array.from(document.querySelectorAll(".filter-chip[data-filter]"));
    const cards = Array.from(document.querySelectorAll("#projectCards .doc-card"));
    const empty = document.getElementById("projectEmpty");
    if (!chips.length || !cards.length) return;

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.dataset.filter;
        chips.forEach((other) => other.setAttribute("aria-pressed", String(other === chip)));
        let visible = 0;
        cards.forEach((card) => {
          const show = filter === "all" || card.dataset.group === filter;
          card.hidden = !show;
          if (show) visible += 1;
        });
        if (empty) empty.hidden = visible > 0;
      });
    });
  }

  /* ---------- Arranque ---------- */
  function onScroll() {
    updateProgress();
    updateTocProgress();
  }

  function init() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    setStaggerDelays();
    decorateHeadings();
    wrapTables();
    decorateCode();
    markActiveNav();
    observeReveals();
    bindSpotlights();
    initScrollspy();
    initFilters();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    // Al cambiar de idioma, recolocar textos generados por script.
    document.addEventListener("langchange", () => {
      decorateCode();
      if (sidebarToggle) {
        sidebarToggle.innerHTML = `${iconHtml("panel")}<span data-i18n="docs.jumpTo">${textFor("docs.jumpTo", "Ir a")}</span>`;
      }
      setSidebar(sidebar?.classList.contains("open") && window.innerWidth <= 860);
    });

    // Resaltar el destino de un ancla al llegar con #fragmento.
    if (window.location.hash) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
