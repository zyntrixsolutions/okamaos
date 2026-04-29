const fallbackCatalog = {
  apps: [
    {
      id: "com.okamalabs.demo",
      name: "Okama Demo Game",
      version: "0.1.1",
      runtime: "okama-sdl2",
      category: "Starter",
      status: "available",
      tagline: "The first controller-first drop for every fresh OkamaOS build.",
      description:
        "Reference demo game showing sprite movement, pause handling, save state, audio permissions, and clean return to the OkamaOS shell.",
      download_url: "https://amakodev.github.io/okamaos_projectX/downloads/games/com.okamalabs.demo-0.1.1.ok",
      manifest_url: "https://amakodev.github.io/okamaos_projectX/catalog/manifests/com.okamalabs.demo.json",
      sha256: "10689ad9449d9d54bbc648e66a6b59784424757a035f8f6164479b2d4cd6ef44",
      size_bytes: 13520,
      min_os_version: "0.1.0",
      target_fps: 30,
      featured: true
    }
  ]
};

const fallbackUpdates = {
  latest: {
    version: "1.0.1",
    codename: "First Wave Notify",
    date: "2026-04-29",
    status: "preview",
    priority: "recommended",
    title: "OS and game update notifications",
    summary:
      "OkamaOS now checks the public update feed and app catalog, then shows in-OS notifications when OS or installed-game updates are available.",
    notes: [
      "Adds home-screen notifications for available OS updates.",
      "Adds installed-game update detection against the public app catalog.",
      "Updates okama-update check to print notices and download links."
    ],
    release_notes_url: "CHANGELOG.md",
    download_url: "https://amakodev.github.io/okamaos_projectX/updates/okamaos-v1.0.1.okupdate",
    artifact_status: "manifest-ready"
  }
};

const $ = (selector) => document.querySelector(selector);

function formatBytes(bytes) {
  if (!bytes) return "TBD";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function loadJson(path, fallback) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

function renderCatalog(data) {
  const grid = $("#catalogGrid");
  const apps = data.apps || [];
  const downloadable = apps.filter((app) => app.status === "available").length;
  $("#heroCatalogCount").textContent = `${downloadable} live drop${downloadable === 1 ? "" : "s"}`;

  grid.innerHTML = apps
    .map((app) => {
      const disabled = app.status !== "available" || !app.download_url;
      const downloadAttrs = disabled
        ? 'href="#" aria-disabled="true"'
        : `href="${app.download_url}" download`;
      const manifestLink = app.manifest_url
        ? `<a class="button secondary" href="${app.manifest_url}">Manifest</a>`
        : "";

      return `
        <article class="catalog-card ${app.featured ? "featured" : ""}">
          <div class="status-row">
            <span class="status-pill ${app.status}">${app.status.replace("-", " ")}</span>
            <span class="meta-label">${app.category || "Game"}</span>
          </div>
          <h3>${app.name}</h3>
          <p><strong>${app.tagline || ""}</strong></p>
          <p class="description">${app.description || ""}</p>
          <div class="card-meta">
            <span>v${app.version}</span>
            <span>${app.runtime}</span>
            <span>${formatBytes(app.size_bytes)}</span>
          </div>
          <div class="download-row">
            <a class="button primary" ${downloadAttrs}>Download .ok</a>
            ${manifestLink}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderUpdate(data) {
  const latest = data.latest || {};
  const notes = latest.notes || [];
  const downloadLabel =
    latest.artifact_status === "manifest-ready"
      ? "Download v1 update"
      : "Release assets";
  $("#updateCard").innerHTML = `
    <span class="status-pill">${latest.priority || "update"}</span>
    <h3>${latest.version || "TBD"} ${latest.codename || ""}</h3>
    <p>${latest.summary || ""}</p>
    <div class="card-meta">
      <span>${latest.date || ""}</span>
      <span>${latest.status || ""}</span>
      <span>${latest.artifact_status || ""}</span>
    </div>
    <ul class="update-list">
      ${notes.map((note) => `<li>${note}</li>`).join("")}
    </ul>
    <div class="download-row">
      <a class="button primary" href="${latest.download_url || "#"}">${downloadLabel}</a>
      <a class="button secondary" href="${latest.release_notes_url || "CHANGELOG.md"}">Release notes</a>
    </div>
  `;
}

function startSignalCanvas() {
  const canvas = $("#signalCanvas");
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let frame = 0;

  function resize() {
    const scale = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function draw() {
    frame += 1;
    context.clearRect(0, 0, width, height);

    context.fillStyle = "#10120f";
    context.fillRect(0, 0, width, height);

    const grid = 36;
    context.strokeStyle = "rgba(243, 239, 228, 0.08)";
    context.lineWidth = 1;
    for (let x = (frame * 0.18) % grid; x < width; x += grid) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = (frame * 0.12) % grid; y < height; y += grid) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    const consoleWidth = Math.min(560, width * 0.72);
    const consoleHeight = consoleWidth * 0.38;
    const x = width * 0.58 - consoleWidth / 2;
    const y = height * 0.48 - consoleHeight / 2;

    context.strokeStyle = "rgba(141, 247, 127, 0.62)";
    context.lineWidth = 2;
    context.strokeRect(x, y, consoleWidth, consoleHeight);
    context.strokeStyle = "rgba(255, 207, 74, 0.52)";
    context.strokeRect(x + 18, y + 18, consoleWidth - 36, consoleHeight - 36);

    const pulse = Math.sin(frame / 34) * 0.5 + 0.5;
    context.fillStyle = `rgba(83, 217, 230, ${0.22 + pulse * 0.25})`;
    context.fillRect(x + 38, y + 42, consoleWidth * 0.34, 16);
    context.fillStyle = `rgba(242, 109, 91, ${0.18 + pulse * 0.22})`;
    context.fillRect(x + 38, y + 72, consoleWidth * 0.5, 16);
    context.fillStyle = "rgba(141, 247, 127, 0.42)";
    context.beginPath();
    context.arc(x + consoleWidth - 74, y + consoleHeight - 58, 20 + pulse * 6, 0, Math.PI * 2);
    context.fill();

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

async function boot() {
  startSignalCanvas();
  const [catalog, updates] = await Promise.all([
    loadJson("catalog/apps.json", fallbackCatalog),
    loadJson("updates/feed.json", fallbackUpdates)
  ]);
  renderCatalog(catalog);
  renderUpdate(updates);
}

boot();
