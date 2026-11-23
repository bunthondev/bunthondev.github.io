const APPS = [
  {
    id: "rundock",
    name: "RunDock",
    repo: "bunthondev/RunDock",
    url: "https://bunthondev.github.io/RunDock/",
    repoUrl: "https://github.com/bunthondev/RunDock",
    releasesUrl: "https://github.com/bunthondev/RunDock/releases/latest",
    icon: "./assets/rundock-icon.png",
    fallbackTag: "v0.1.0",
    downloadExt: ".dmg",
    defaultDownloadLabel: "Download DMG",
    subtitle: "Runtimes, PATH shims & local services",
    keywords: "rundock rust tauri node python php go bun deno java postgres caddy mailpit nginx cli",
  },
  {
    id: "deepclean",
    name: "DeepClean",
    repo: "bunthondev/deep-clean",
    url: "https://bunthondev.github.io/deep-clean/",
    repoUrl: "https://github.com/bunthondev/deep-clean",
    releasesUrl: "https://github.com/bunthondev/deep-clean/releases/latest",
    icon: "./assets/deepclean-icon.png",
    fallbackTag: "v0.2.8",
    downloadExt: ".zip",
    defaultDownloadLabel: "Download ZIP",
    subtitle: "Safe developer cache & disk cleaner for Mac",
    keywords: "deepclean swift macos cleaner cache disk storage node_modules xcode trash homebrew",
  },
];

const CACHE_PREFIX = "bunthondev-rel-v1:";
const CACHE_TTL_MS = 10 * 60 * 1000;

function formatBytes(bytes) {
  if (!bytes || typeof bytes !== "number") return "";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(1)} ${units[idx]}`;
}

/* Theme toggle */
function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  const metaTheme = document.getElementById("meta-theme-color");

  const applyTheme = (theme, persist = false) => {
    document.documentElement.setAttribute("data-theme", theme);
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "dark" ? "#080b11" : "#f8fafc");
    }
    if (toggleBtn) {
      toggleBtn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    if (persist) {
      try {
        localStorage.setItem("bunthondev-theme", theme);
      } catch {
        // Ignore storage errors
      }
    }
  };

  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current, false);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      applyTheme(next, true);
    });
  }
}

/* Category filtering */
function initFilters() {
  const pills = document.querySelectorAll(".filter-pill");
  const cards = document.querySelectorAll(".app-card");

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const filter = pill.dataset.filter || "all";
      pills.forEach((p) => {
        const active = p === pill;
        p.classList.toggle("active", active);
        p.setAttribute("aria-selected", String(active));
      });

      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.hidden = !match;
      });
    });
  });
}

/* Copy buttons */
function initCopyButtons() {
  document.querySelectorAll("[data-copy-target]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-copy-target");
      const el = targetId ? document.getElementById(targetId) : null;
      if (!el) return;
      const text = (el.textContent || "").trim();
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        btn.classList.add("copied");
        window.setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1800);
      } catch {
        btn.textContent = "Failed";
        window.setTimeout(() => {
          btn.textContent = "Copy";
        }, 1600);
      }
    });
  });
}

/* GitHub Releases hydration with short sessionStorage cache */
async function fetchLatestRelease(app) {
  const cacheKey = `${CACHE_PREFIX}${app.repo}`;
  try {
    const cachedRaw = sessionStorage.getItem(cacheKey);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS && cached.data) {
        return cached.data;
      }
    }
  } catch {
    // Ignore cache parse issues
  }

  const res = await fetch(`https://api.github.com/repos/${app.repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore quota errors
  }
  return data;
}

function hydrateReleases() {
  APPS.forEach(async (app) => {
    try {
      const rel = await fetchLatestRelease(app);
      const tag = rel.tag_name || app.fallbackTag;
      document.querySelectorAll(`[data-release-tag="${app.id}"]`).forEach((el) => {
        el.textContent = tag;
      });

      const assets = Array.isArray(rel.assets) ? rel.assets : [];
      const primaryAsset = assets.find(
        (asset) =>
          typeof asset.name === "string" &&
          asset.name.toLowerCase().endsWith(app.downloadExt)
      );

      if (primaryAsset && primaryAsset.browser_download_url) {
        const downloadBtn = document.querySelector(`[data-download-btn="${app.id}"]`);
        const downloadLabel = document.querySelector(`[data-download-label="${app.id}"]`);
        if (downloadBtn) {
          downloadBtn.setAttribute("href", primaryAsset.browser_download_url);
          downloadBtn.setAttribute(
            "title",
            `Download ${primaryAsset.name} (${formatBytes(primaryAsset.size)})`
          );
        }
        if (downloadLabel && primaryAsset.size) {
          downloadLabel.textContent = `${app.defaultDownloadLabel} (${formatBytes(primaryAsset.size)})`;
        }
      }
    } catch {
      // Keep clean static fallback values when offline or rate-limited
    }
  });
}

/* Command Palette (⌘K / Ctrl+K) */
function initCommandPalette() {
  const overlay = document.getElementById("cmd-overlay");
  const openBtn = document.getElementById("cmd-open");
  const closeBtn = document.getElementById("cmd-close");
  const input = document.getElementById("cmd-input");
  const list = document.getElementById("cmd-list");
  const kbd = document.getElementById("cmd-kbd");

  if (!overlay || !input || !list) return;

  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");
  if (kbd) kbd.textContent = isMac ? "⌘K" : "Ctrl K";

  const commands = [
    ...APPS.map((app) => ({
      title: `Open ${app.name} Website`,
      sub: app.url.replace(/^https?:\/\//, ""),
      tag: "App Page",
      icon: app.icon,
      keywords: `${app.keywords} open visit page website`,
      run: () => {
        window.location.href = app.url;
      },
    })),
    ...APPS.map((app) => ({
      title: `${app.name} — Latest GitHub Release`,
      sub: `Download latest build for ${app.name}`,
      tag: "Download",
      icon: app.icon,
      keywords: `${app.keywords} download release dmg zip`,
      run: () => {
        window.open(app.releasesUrl, "_blank", "noopener,noreferrer");
      },
    })),
    {
      title: "Copy Homebrew command for DeepClean",
      sub: "brew install --cask bunthondev/tap/deepclean",
      tag: "Copy",
      keywords: "brew homebrew install deepclean copy terminal",
      run: async () => {
        try {
          await navigator.clipboard.writeText("brew install --cask bunthondev/tap/deepclean");
        } catch {
          // Ignore clipboard error
        }
      },
    },
    {
      title: "Open bunthondev on GitHub",
      sub: "github.com/bunthondev",
      tag: "Profile",
      keywords: "github profile source repos bunthon mao",
      run: () => {
        window.open("https://github.com/bunthondev", "_blank", "noopener,noreferrer");
      },
    },
    {
      title: "Toggle Light / Dark Theme",
      sub: "Switch color appearance",
      tag: "Theme",
      keywords: "theme dark light mode appearance",
      run: () => {
        const toggle = document.getElementById("theme-toggle");
        if (toggle) toggle.click();
      },
    },
  ];

  let filtered = [...commands];
  let activeIndex = 0;

  const close = () => {
    overlay.hidden = true;
    document.body.style.overflow = "";
  };

  const render = () => {
    list.innerHTML = "";
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "cmd-empty";
      empty.textContent = "No matching apps or actions.";
      list.appendChild(empty);
      return;
    }

    filtered.forEach((cmd, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `cmd-item${idx === activeIndex ? " active" : ""}`;
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", String(idx === activeIndex));

      const iconWrap = document.createElement("span");
      iconWrap.className = "cmd-item-icon";
      if (cmd.icon) {
        const img = document.createElement("img");
        img.src = cmd.icon;
        img.alt = "";
        iconWrap.appendChild(img);
      } else {
        iconWrap.innerHTML =
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
      }

      const textWrap = document.createElement("span");
      textWrap.className = "cmd-item-text";

      const title = document.createElement("span");
      title.className = "cmd-item-title";
      title.textContent = cmd.title;

      const sub = document.createElement("span");
      sub.className = "cmd-item-sub";
      sub.textContent = cmd.sub;

      textWrap.appendChild(title);
      textWrap.appendChild(sub);

      const tag = document.createElement("span");
      tag.className = "cmd-item-tag";
      tag.textContent = cmd.tag;

      btn.appendChild(iconWrap);
      btn.appendChild(textWrap);
      btn.appendChild(tag);

      btn.addEventListener("mouseenter", () => {
        activeIndex = idx;
        renderActiveState();
      });

      btn.addEventListener("click", () => {
        close();
        cmd.run();
      });

      list.appendChild(btn);
    });
  };

  const renderActiveState = () => {
    list.querySelectorAll(".cmd-item").forEach((el, idx) => {
      const isActive = idx === activeIndex;
      el.classList.toggle("active", isActive);
      el.setAttribute("aria-selected", String(isActive));
    });
  };

  const open = () => {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    input.value = "";
    filtered = [...commands];
    activeIndex = 0;
    render();
    input.focus();
  };

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    filtered = !q
      ? [...commands]
      : commands.filter((cmd) =>
          `${cmd.title} ${cmd.sub} ${cmd.keywords}`.toLowerCase().includes(q)
        );
    activeIndex = 0;
    render();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (overlay.hidden) open();
      else close();
      return;
    }

    if (overlay.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filtered.length) {
        activeIndex = (activeIndex + 1) % filtered.length;
        renderActiveState();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (filtered.length) {
        activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
        renderActiveState();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = filtered[activeIndex];
      if (chosen) {
        close();
        chosen.run();
      }
    }
  });
}

initTheme();
initFilters();
initCopyButtons();
hydrateReleases();
initCommandPalette();
