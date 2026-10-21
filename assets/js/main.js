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

  const locale = () => (getLang() === "es" ? "es-ES" : "en-US");

  function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
  let sidebarReturnFocus = null;

  function setSidebar(open) {
    if (!sidebar) return;
    sidebar.classList.toggle("open", open);
    sidebarToggle?.setAttribute("aria-expanded", String(open));
    sidebarToggle?.setAttribute(
      "aria-label",
      textFor(open ? "aria.closeSidebar" : "aria.openSidebar", open ? "Cerrar índice" : "Abrir índice")
    );
    if (open) {
      // Guardamos quién abrió el drawer para devolverle el foco al cerrarlo.
      sidebarReturnFocus = document.activeElement;
      if (!sidebarScrim) {
        sidebarScrim = document.createElement("div");
        sidebarScrim.className = "sidebar-scrim";
        sidebarScrim.addEventListener("click", () => setSidebar(false));
        document.body.append(sidebarScrim);
      }
      const active = sidebar.querySelector(".side-nav__link.active");
      if (active) {
        // El mismo motivo que en la fila de chips: scrollIntoView puede arrastrar
        // la ventana. El cajón ya se desplaza solo, así que se mueve únicamente él.
        const box = sidebar.getBoundingClientRect();
        const item = active.getBoundingClientRect();
        if (item.top < box.top || item.bottom > box.bottom) sidebar.scrollTop += item.top - box.top - 16;
      }
      (active || sidebar.querySelector(".side-nav__link"))?.focus?.({ preventScroll: true });
    } else {
      sidebarScrim?.remove();
      sidebarScrim = null;
      // Solo devolvemos el foco si estaba dentro del drawer: así un cierre por
      // resize no le roba el foco a quien estuviera leyendo otra cosa. Si no
      // hay un origen útil (se abrió por código), caemos en el propio botón:
      // un drawer cerrado nunca debe quedarse con el foco.
      if (sidebar.contains(document.activeElement)) {
        const returnTo = sidebarReturnFocus && sidebarReturnFocus !== document.body
          ? sidebarReturnFocus
          : sidebarToggle;
        returnTo?.focus?.({ preventScroll: true });
      }
      sidebarReturnFocus = null;
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

  /* ---------- Escape: cierra cualquier capa abierta ---------- */
  // El buscador ya gestiona su propio Escape; aquí cubrimos el menú burger y
  // el drawer del índice, que antes solo se cerraban haciendo clic.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (sidebar?.classList.contains("open")) {
      setSidebar(false);
      event.stopPropagation();
      return;
    }
    if (mobileMenu?.classList.contains("open")) {
      burger?.click();
      burger?.focus?.();
      event.stopPropagation();
    }
  });

  // Clic fuera del menú burger: cerrarlo, como espera cualquier navegación.
  document.addEventListener("click", (event) => {
    if (!mobileMenu?.classList.contains("open")) return;
    if (event.target.closest("#mobileMenu, #burger")) return;
    burger?.click();
  });

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
  let tocLinks = [];
  let spyObserver = null;

  function initScrollspy() {
    // Se reconsultan en cada inicialización: al cambiar de idioma el índice se
    // sustituye entero y los nodos anteriores quedan desconectados del DOM.
    spyObserver?.disconnect();
    spyObserver = null;
    tocLinks = Array.from(document.querySelectorAll(".toc__list a"));
    tocLinks.forEach((link) => link.classList.remove("active"));
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
      // En pantallas estrechas el índice es una fila de chips desplazable: si el
      // apartado activo queda fuera de vista, se trae al primer plano. Se mira
      // el layout real y no el ancho, para no duplicar el breakpoint del CSS.
      const activeLink = tocLinks.find((link) => link.classList.contains("active"));
      const list = activeLink?.closest(".toc__list");
      if (list && window.getComputedStyle(list).display === "flex") {
        // Aquí nunca scrollIntoView: desplaza también la ventana, y en pantallas
        // estrechas la fila de chips va en flujo normal por encima del texto, así
        // que cada cambio de apartado devolvía al lector arriba del todo. Se mueve
        // solo el contenedor, y solo cuando el chip activo se sale de él.
        const box = list.getBoundingClientRect();
        const chip = activeLink.getBoundingClientRect();
        if (chip.left < box.left || chip.right > box.right) {
          list.scrollTo({
            left: Math.max(0, list.scrollLeft + chip.left - box.left - (list.clientWidth - chip.width) / 2),
            behavior: reducedMotion ? "auto" : "smooth",
          });
        }
      }
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

  function initStatus() {

    const statusSummary = document.getElementById("statusSummary");
    if (statusSummary) {
      const statusOverall = document.getElementById("statusOverall");
      const statusUpdated = document.getElementById("statusUpdated");
      const statusComponents = document.getElementById("statusComponents");
      const statusError = document.getElementById("statusError");
      const statusMaintenance = document.getElementById("statusMaintenance");
      const statusMaintenanceBody = document.getElementById("statusMaintenanceBody");
      const STATUS_INDICATORS = {
        none: "status.allOperational",
        minor: "status.minorIssues",
        major: "status.majorIssues",
        critical: "status.criticalIssues",
        maintenance: "status.maintenanceOverall",
      };
      const STATUS_COMPONENTS = {
        operational: "status.operational",
        degraded_performance: "status.degraded",
        partial_outage: "status.partial",
        major_outage: "status.major",
        under_maintenance: "status.underMaintenance",
      };
      let lastStatusSummary = null;
      let statusFailed = false;

      const statusDotState = (indicator) => {
        if (indicator === "none") return "operational";
        if (indicator === "critical" || indicator === "major") return "outage";
        if (indicator === "minor" || indicator === "maintenance") return "degraded";
        return "unknown";
      };

      const formatStatusDate = (value) => {
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) return "";
        return date.toLocaleString(locale(), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      };

      function renderStatusMaintenance(items) {
        if (!statusMaintenance || !statusMaintenanceBody) return;
        const list = Array.isArray(items) ? items.filter(Boolean) : [];
        if (!list.length) {
          statusMaintenanceBody.replaceChildren();
          statusMaintenance.hidden = true;
          return;
        }
        statusMaintenance.hidden = false;
        statusMaintenanceBody.innerHTML = list.map((item) => {
          const update = Array.isArray(item.incident_updates) ? item.incident_updates[0] : null;
          const body = update && update.body ? `<p>${escapeHtml(update.body)}</p>` : "";
          const starts = item.scheduled_for ? formatStatusDate(item.scheduled_for) : "";
          const ends = item.scheduled_until ? formatStatusDate(item.scheduled_until) : "";
          const windowText = starts && ends ? `<p class="status-maintenance__meta">${escapeHtml(starts)} – ${escapeHtml(ends)}</p>` : "";
          return `<div class="status-maintenance__item"><p><strong>${escapeHtml(item.name || "")}</strong></p>${body}${windowText}<p class="status-maintenance__meta">${escapeHtml(textFor("status.maintenanceBody", "Text published on the status page."))}</p></div>`;
        }).join("");
      }

      function renderStatus(data) {
        statusFailed = false;
        const indicator = data && data.status ? data.status.indicator : "";
        statusSummary.dataset.state = statusDotState(indicator);
        statusSummary.setAttribute("aria-busy", "false");
        if (statusOverall) statusOverall.textContent = textFor(STATUS_INDICATORS[indicator] || "status.unknown", textFor("status.unknown", "Status unavailable"));
        if (statusUpdated) {
          const updatedAt = (data && data.page && data.page.updated_at) || "";
          const formatted = formatStatusDate(updatedAt);
          statusUpdated.textContent = formatted ? textFor("status.updated", "Updated {date}").replace("{date}", formatted) : "";
        }
        if (statusComponents) {
          const components = Array.isArray(data && data.components) ? data.components.filter((item) => item && item.name) : [];
          statusComponents.innerHTML = components.map((component) => {
            const key = STATUS_COMPONENTS[component.status] || "status.unknown";
            return `<li class="status-component" data-status="${escapeHtml(component.status || "")}"><span class="status-component__dot" aria-hidden="true"></span><span class="status-component__name">${escapeHtml(component.name)}</span><span class="status-component__state">${escapeHtml(textFor(key, component.status || ""))}</span></li>`;
          }).join("");
        }
        if (statusError) statusError.hidden = true;
        renderStatusMaintenance(data && data.scheduled_maintenances);
      }

      function renderStatusError() {
        statusFailed = true;
        lastStatusSummary = null;
        statusSummary.dataset.state = "unknown";
        statusSummary.setAttribute("aria-busy", "false");
        if (statusOverall) statusOverall.textContent = textFor("status.unknown", "Status unavailable");
        if (statusUpdated) statusUpdated.textContent = "";
        if (statusComponents) statusComponents.replaceChildren();
        if (statusMaintenance) statusMaintenance.hidden = true;
        if (statusError) statusError.hidden = false;
      }

      async function loadStatusSummary() {
        try {
          const response = await fetch(statusSummary.dataset.api, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
          if (!response.ok) throw new Error(`Status API error (${response.status})`);
          const data = await response.json();
          if (!data || typeof data !== "object") throw new Error("Invalid status payload");
          lastStatusSummary = data;
          renderStatus(data);
        } catch (error) {
          console.warn("Status summary unavailable:", error);
          renderStatusError();
        }
      }

      const statusFrameWrap = document.getElementById("statusFrameWrap");
      const loadStatusFrame = document.getElementById("loadStatusFrame");
      if (statusFrameWrap && loadStatusFrame) {
        loadStatusFrame.addEventListener("click", () => {
          const frame = document.createElement("iframe");
          frame.src = "https://statuspage.incident.io/jaime-gaming";
          frame.title = textFor("status.frameTitle", "Jaime Gaming status page");
          frame.setAttribute("loading", "lazy");
          frame.setAttribute("referrerpolicy", "no-referrer");
          const placeholder = document.getElementById("statusFramePlaceholder");
          if (placeholder) placeholder.replaceWith(frame);
          else statusFrameWrap.replaceChildren(frame);
          loadStatusFrame.remove();
        });
      }

      loadStatusSummary();
      document.addEventListener("langchange", () => {
        if (lastStatusSummary) renderStatus(lastStatusSummary);
        else if (statusFailed) renderStatusError();
      });
    }
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

    // Al cambiar de idioma, recolocar textos generados por script. El cuerpo y
    // el índice lateral se sustituyen enteros desde #pageTranslations, así que
    // todo lo que se les añadió por script hay que volver a construirlo.
    document.addEventListener("langchange", () => {
      decorateHeadings();
      wrapTables();
      decorateCode();
      initScrollspy();
      if (sidebarToggle) {
        sidebarToggle.innerHTML = `${iconHtml("panel")}<span data-i18n="docs.jumpTo">${textFor("docs.jumpTo", "Ir a")}</span>`;
      }
      setSidebar(sidebar?.classList.contains("open") && window.innerWidth <= 860);
    });

    initStatus();

    // Resaltar el destino de un ancla al llegar con #fragmento.
    if (window.location.hash) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
