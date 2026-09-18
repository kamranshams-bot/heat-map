(() => {
  "use strict";

  // ---- Working copy of the dataset (live fetches merge into this, never
  // the original SECTORS/INDEXES constants, so "sample" stays recoverable) --
  const workingSectors = structuredClone(SECTORS);
  const workingIndexes = structuredClone(INDEXES);

  const state = {
    view: "all", // "all" | sector id
    table: false,
    liveSymbols: new Set(), // symbols currently showing a live quote
    lastLiveAt: null,
  };

  // ---------------------------------------------------------------- color --
  const lightStops = ["#7a1a1a", "#e46b6b", "#f0efec", "#8fd98f", "#1c7a1c"];
  const darkStops = ["#7a1a1a", "#e46b6b", "#383835", "#8fd98f", "#1c7a1c"];

  function isDark() {
    const stamped = document.documentElement.getAttribute("data-theme");
    if (stamped === "dark") return true;
    if (stamped === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function colorFor(pct, maxAbs) {
    const stops = isDark() ? darkStops : lightStops;
    const scale = divergingScale(stops, -maxAbs, 0, maxAbs);
    return scale(pct);
  }

  function textColorFor(bgHex) {
    return relativeLuminance(bgHex) > 0.6 ? "#0b0b0b" : "#ffffff";
  }

  function fmtPct(pct) {
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct.toFixed(1)}%`;
  }

  // --------------------------------------------------------------- layout --
  function currentMaxAbs(items) {
    const max = Math.max(...items.map((d) => Math.abs(d.changePct)));
    return Math.max(max || 0, 1.5); // floor so a quiet day doesn't look neon
  }

  function renderLegend(maxAbs) {
    const el = document.getElementById("legend");
    const stops = isDark() ? darkStops : lightStops;
    const gradient = `linear-gradient(to right, ${stops.join(",")})`;
    el.innerHTML = `
      <div class="legend-bar" style="background:${gradient}"></div>
      <div class="legend-ticks">
        <span>-${maxAbs.toFixed(1)}%</span>
        <span>0%</span>
        <span>+${maxAbs.toFixed(1)}%</span>
      </div>
    `;
  }

  function renderBreadcrumbs() {
    const el = document.getElementById("breadcrumbs");
    if (state.view === "all") {
      el.innerHTML = `<span class="crumb current">All sectors</span>`;
      return;
    }
    const sector = workingSectors.find((s) => s.id === state.view);
    el.innerHTML = `
      <button class="crumb link" data-action="up">All sectors</button>
      <span class="crumb-sep">/</span>
      <span class="crumb current">${sector.name}</span>
    `;
    el.querySelector('[data-action="up"]').addEventListener("click", () => {
      state.view = "all";
      render();
    });
  }

  function cellNode(item, isSector) {
    const div = document.createElement("div");
    div.className = "cell";
    div.tabIndex = 0;
    div.setAttribute("role", "button");
    const live = state.liveSymbols.has(isSector ? item.etf : item.symbol);
    div.setAttribute(
      "aria-label",
      `${item.name}, ${fmtPct(item.changePct)}${live ? ", live" : ", sample data"}`
    );
    return div;
  }

  function layoutAndRender(container, items, valueKey, onClick, isSector) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const padding = 2;
    const weighted = items.map((d) => ({ ...d, weight: d[valueKey] }));
    const leaves = squarify(weighted, 0, 0, width, height);

    const maxAbs = currentMaxAbs(items);
    renderLegend(maxAbs);

    container.innerHTML = "";
    leaves.forEach((leaf) => {
      const item = leaf.item;
      const w = Math.max(0, leaf.x1 - leaf.x0 - padding);
      const h = Math.max(0, leaf.y1 - leaf.y0 - padding);
      const bg = colorFor(item.changePct, maxAbs);
      const fg = textColorFor(bg);
      const cell = cellNode(item, isSector);
      cell.style.left = `${leaf.x0}px`;
      cell.style.top = `${leaf.y0}px`;
      cell.style.width = `${w}px`;
      cell.style.height = `${h}px`;
      cell.style.background = bg;
      cell.style.color = fg;

      const showName = w > 70 && h > 34;
      const showTicker = w > 40 && h > 20;
      const label = isSector ? item.name : item.symbol;
      if (!showTicker) {
        cell.innerHTML = `<div class="cell-change small">${fmtPct(item.changePct)}</div>`;
      } else if (isSector) {
        cell.innerHTML = `
          <div class="cell-symbol">${item.name}</div>
          <div class="cell-sub">${item.etf} · wt ${item.weight.toFixed(1)}%</div>
          <div class="cell-change">${fmtPct(item.changePct)}</div>
        `;
      } else {
        cell.innerHTML = `
          <div class="cell-symbol">${item.symbol}</div>
          ${showName ? `<div class="cell-sub">${item.name}</div>` : ""}
          <div class="cell-change">${fmtPct(item.changePct)}</div>
        `;
      }

      cell.title = `${label} — ${fmtPct(item.changePct)}${
        state.liveSymbols.has(isSector ? item.etf : item.symbol)
          ? " (live)"
          : " (sample data)"
      }`;

      if (onClick) {
        cell.addEventListener("click", () => onClick(item));
        cell.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(item);
          }
        });
      }
      container.appendChild(cell);
    });
  }

  function renderHeatmap() {
    const container = document.getElementById("heatmap");
    container.classList.remove("hidden");
    document.getElementById("table-wrap").classList.add("hidden");

    if (state.view === "all") {
      layoutAndRender(
        container,
        workingSectors,
        "weight",
        (sector) => {
          state.view = sector.id;
          render();
        },
        true
      );
    } else {
      const sector = workingSectors.find((s) => s.id === state.view);
      layoutAndRender(container, sector.stocks, "weight", null, false);
    }
  }

  function flatRows() {
    if (state.view === "all") {
      return workingSectors.map((s) => ({
        label: s.name,
        symbol: s.etf,
        weight: s.weight,
        changePct: s.changePct,
        live: state.liveSymbols.has(s.etf),
      }));
    }
    const sector = workingSectors.find((s) => s.id === state.view);
    return sector.stocks.map((st) => ({
      label: st.name,
      symbol: st.symbol,
      weight: st.weight,
      changePct: st.changePct,
      live: state.liveSymbols.has(st.symbol),
    }));
  }

  let sortState = { key: "changePct", dir: -1 };

  function renderTable() {
    document.getElementById("heatmap").classList.add("hidden");
    const wrap = document.getElementById("table-wrap");
    wrap.classList.remove("hidden");

    const rows = flatRows().sort((a, b) => {
      const va = a[sortState.key];
      const vb = b[sortState.key];
      if (typeof va === "string") return va.localeCompare(vb) * sortState.dir;
      return (va - vb) * sortState.dir;
    });

    const cols = [
      { key: "label", label: "Name" },
      { key: "symbol", label: "Symbol" },
      { key: "weight", label: "Weight %" },
      { key: "changePct", label: "Change %" },
    ];

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            ${cols
              .map(
                (c) => `<th data-key="${c.key}" tabindex="0" role="button">
                  ${c.label}${sortState.key === c.key ? (sortState.dir === 1 ? " ▲" : " ▼") : ""}
                </th>`
              )
              .join("")}
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              <td>${r.label}</td>
              <td class="mono">${r.symbol}</td>
              <td class="num mono">${r.weight.toFixed(1)}</td>
              <td class="num mono ${r.changePct >= 0 ? "up" : "down"}">${fmtPct(r.changePct)}</td>
              <td>${r.live ? "Live" : "Sample"}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    wrap.querySelectorAll("th[data-key]").forEach((th) => {
      const activate = () => {
        const key = th.dataset.key;
        sortState.dir = sortState.key === key ? -sortState.dir : -1;
        sortState.key = key;
        renderTable();
      };
      th.addEventListener("click", activate);
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  // ------------------------------------------------------------ statTiles --
  function sparklinePath(values, w, h) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = w / (values.length - 1);
    return values
      .map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / span) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  function renderIndexTiles() {
    const el = document.getElementById("index-tiles");
    el.innerHTML = workingIndexes
      .map((idx) => {
        const up = idx.changePct >= 0;
        const path = sparklinePath(idx.sparkline, 96, 28);
        const live = state.liveSymbols.has(idx.symbol);
        return `
        <div class="stat-tile">
          <div class="stat-label">${idx.name}${live ? '<span class="live-dot" title="Live">●</span>' : ""}</div>
          <div class="stat-value">${idx.price.toFixed(2)}</div>
          <div class="stat-delta ${up ? "up" : "down"}">${fmtPct(idx.changePct)}</div>
          <svg class="sparkline" viewBox="0 0 96 28" preserveAspectRatio="none">
            <path d="${path}" fill="none" stroke="${up ? "var(--up)" : "var(--down)"}" stroke-width="2" />
          </svg>
        </div>`;
      })
      .join("");

  }

  function allStocksFlat() {
    return workingSectors.flatMap((sector) =>
      sector.stocks.map((st) => ({
        ...st,
        sectorId: sector.id,
        sectorName: sector.name,
      }))
    );
  }

  function moverRow(stock) {
    const up = stock.changePct >= 0;
    const live = state.liveSymbols.has(stock.symbol);
    return `
      <li class="mover-row" data-sector="${stock.sectorId}" tabindex="0" role="button"
          title="Jump to ${stock.sectorName}">
        <span class="mover-id">
          <span class="mover-symbol">${stock.symbol}${live ? '<span class="live-dot" title="Live">●</span>' : ""}</span>
          <span class="mover-sector">${stock.sectorName}</span>
        </span>
        <span class="mover-change ${up ? "up" : "down"}">${fmtPct(stock.changePct)}</span>
      </li>`;
  }

  function renderMoversRow() {
    const el = document.getElementById("movers-row");
    const advancing = workingSectors.filter((s) => s.changePct > 0).length;

    const all = allStocksFlat();
    const gainers = [...all].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
    const losers = [...all].sort((a, b) => a.changePct - b.changePct).slice(0, 5);

    el.innerHTML = `
      <div class="stat-tile">
        <div class="stat-label">Sector breadth</div>
        <div class="stat-value">${advancing} / ${workingSectors.length}</div>
        <div class="stat-delta ${advancing >= workingSectors.length / 2 ? "up" : "down"}">sectors advancing</div>
      </div>
      <div class="stat-tile mover-tile">
        <div class="stat-label">Top gainers</div>
        <ul class="mover-list">${gainers.map(moverRow).join("")}</ul>
      </div>
      <div class="stat-tile mover-tile">
        <div class="stat-label">Top losers</div>
        <ul class="mover-list">${losers.map(moverRow).join("")}</ul>
      </div>
    `;

    el.querySelectorAll(".mover-row").forEach((row) => {
      const jump = () => {
        state.view = row.dataset.sector;
        render();
      };
      row.addEventListener("click", jump);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          jump();
        }
      });
    });
  }

  // ------------------------------------------------------------- controls --
  function renderDataBadge(status) {
    const el = document.getElementById("data-badge");
    if (status === "loading") {
      el.textContent = "Fetching live data…";
      el.className = "data-badge loading";
      return;
    }
    if (status === "error") {
      el.textContent = "Live fetch failed — showing sample data";
      el.className = "data-badge error";
      return;
    }
    if (state.liveSymbols.size > 0) {
      el.textContent = `Live for ${state.liveSymbols.size} symbol${
        state.liveSymbols.size === 1 ? "" : "s"
      } · rest sample · ${state.lastLiveAt}`;
      el.className = "data-badge live";
    } else {
      el.textContent = `Sample data · ${DEMO_AS_OF}`;
      el.className = "data-badge sample";
    }
  }

  async function refreshLive() {
    renderDataBadge("loading");
    const btn = document.getElementById("refresh-btn");
    btn.disabled = true;
    try {
      const indexSymbols = workingIndexes.map((i) => i.symbol);
      const sectorSymbols = workingSectors.map((s) => s.etf);
      const stockSymbols =
        state.view === "all"
          ? []
          : workingSectors.find((s) => s.id === state.view).stocks.map((s) => s.symbol);

      const symbols = [...indexSymbols, ...sectorSymbols, ...stockSymbols];
      const quotes = await fetchLiveChanges(symbols);

      quotes.forEach((q, symbol) => {
        state.liveSymbols.add(symbol);
        const idx = workingIndexes.find((i) => i.symbol === symbol);
        if (idx) {
          idx.changePct = q.changePct;
          idx.price = q.price;
        }
        const sector = workingSectors.find((s) => s.etf === symbol);
        if (sector) sector.changePct = q.changePct;
        workingSectors.forEach((s) => {
          const st = s.stocks.find((x) => x.symbol === symbol);
          if (st) st.changePct = q.changePct;
        });
      });

      state.lastLiveAt = new Date().toLocaleTimeString();
      renderDataBadge("ok");
    } catch (err) {
      console.warn("Live data fetch failed:", err);
      renderDataBadge("error");
    } finally {
      btn.disabled = false;
      render();
    }
  }

  function wireControls() {
    document.getElementById("refresh-btn").addEventListener("click", refreshLive);

    document.getElementById("view-toggle").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-view]");
      if (!btn) return;
      state.table = btn.dataset.view === "table";
      document
        .querySelectorAll("#view-toggle button")
        .forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });

    const themeBtn = document.getElementById("theme-toggle");
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("heatmap-theme", next);
      } catch (_) {
        /* private mode / storage blocked — theme just won't persist */
      }
      render();
    });

    try {
      const saved = localStorage.getItem("heatmap-theme");
      if (saved) document.documentElement.setAttribute("data-theme", saved);
    } catch (_) {
      /* ignore */
    }

    window.addEventListener("resize", () => {
      if (!state.table) render();
    });
  }

  function render() {
    renderBreadcrumbs();
    renderIndexTiles();
    renderMoversRow();
    renderDataBadge(state.liveSymbols.size > 0 ? "ok" : "idle");
    if (state.table) {
      renderTable();
    } else {
      renderHeatmap();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireControls();
    render();
  });
})();
