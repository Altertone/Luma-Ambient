/* Luma Ambient — artist gallery.
 *
 * A full-screen overlay "page" that shows every artist in the library as a
 * card grid (avatar + name), grouped under letter headers ("A", "B", … "#"),
 * with an inline filter. Clicking a card opens the artist's page; the play
 * button on hover starts their top tracks. Esc, ✕, or the scrim close it.
 *
 * Data comes from Spicetify's own LibraryAPI (filter id "1" is Artists, as
 * reported by availableFilters) and is paginated, so the gallery shows the
 * whole library — unlike the sidebar grid, which only renders a scrolled
 * window of rows. Results are cached for ~5 minutes.
 *
 * The gallery is opened from the console (LumaAmbient.artists()).
 */
const CACHE_MS = 5 * 60 * 1000;

const PLAY_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M4.5 2.5v11l9-5.5-9-5.5z"/></svg>';
const CLOSE_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M1.47 1.47a.75.75 0 0 1 1.06 0L8 6.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L9.06 8l5.47 5.47a.75.75 0 1 1-1.06 1.06L8 9.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L6.94 8 1.47 2.53a.75.75 0 0 1 0-1.06z"/></svg>';

// Letter headers group the grid; anything outside A–Z falls under "#".
const alphabetHeader = (name) => {
  const first = (name.trim()[0] || "#").toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
};

export function createArtistGallery(onCountChanged = () => {}) {
  const data = { items: null, fetchedAt: 0, promise: null, count: null };
  let root = null;
  let gridEl = null;
  let statusEl = null;
  let searchEl = null;
  let countEl = null;
  let lastFocus = null;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function libraryApi() {
    for (let attempt = 0; attempt < 20; attempt++) {
      if (globalThis.Spicetify?.Platform?.LibraryAPI) {
        return globalThis.Spicetify.Platform.LibraryAPI;
      }
      await wait(250);
    }
    throw new Error("Spicetify LibraryAPI unavailable");
  }

  async function fetchArtists() {
    const library = await libraryApi();
    // Filter id "1" = Artists (read from availableFilters at runtime by
    // earlier testing; older/newer clients keep the order stable because it
    // matches Spotify's filter chips: Playlists, Podcasts, Albums, Artists).
    const perPage = 500;
    let all = [];
    for (let offset = 0; ; offset += perPage) {
      const page = await library.getContents({
        filters: ["1"],
        limit: perPage,
        offset,
      });
      const items = page.items || [];
      all = all.concat(items);
      const total = page.totalLength ?? all.length;
      if (all.length >= total || items.length < perPage) break;
    }
    const seen = new Map();
    for (const item of all) {
      if (!item?.uri || !item.uri.startsWith("spotify:artist:")) continue;
      const id = item.uri.slice("spotify:artist:".length);
      if (seen.has(id)) continue;
      let image = null;
      if (Array.isArray(item.images)) {
        image = (item.images[0]?.url || "").replace(/^http:/, "https:") || null;
      }
      seen.set(id, {
        id,
        name: (item.name || "Artist").replace(/\s+/g, " ").trim(),
        image,
      });
    }
    const artists = [...seen.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    if (!artists.length) throw new Error("no artists returned");
    return artists;
  }

  // Fetch once per open, fresh values at most every CACHE_MS.
  function loadArtists() {
    if (data.items && Date.now() - data.fetchedAt < CACHE_MS) {
      return Promise.resolve(data.items);
    }
    if (data.promise) return data.promise;
    data.promise = fetchArtists()
      .then((items) => {
        data.items = items;
        data.count = items.length;
        data.fetchedAt = Date.now();
        setTimeout(() => {
          data.promise = null;
        }, CACHE_MS);
        onCountChanged(items.length);
        return items;
      })
      .catch((error) => {
        console.warn("[Luma Ambient] artist gallery fetch failed:", error);
        data.promise = null;
        throw error;
      });
    return data.promise;
  }

  function build() {
    if (root) return;
    root = document.createElement("div");
    root.id = "luma-artists";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Artists");

    const scrim = document.createElement("div");
    scrim.className = "luma-artists-scrim";
    scrim.addEventListener("click", () => close());

    const panel = document.createElement("div");
    panel.className = "luma-artists-panel";

    const header = document.createElement("header");
    header.className = "luma-artists-header";

    const titleBlock = document.createElement("div");
    titleBlock.className = "luma-artists-titles";
    const title = document.createElement("h2");
    title.textContent = "Artists";
    countEl = document.createElement("span");
    countEl.className = "luma-artists-count";
    countEl.textContent = "";
    titleBlock.append(title, countEl);
    header.append(titleBlock);

    searchEl = document.createElement("input");
    searchEl.type = "search";
    searchEl.className = "luma-artists-filter";
    searchEl.placeholder = "Filter artists";
    searchEl.setAttribute("aria-label", "Filter artists");
    searchEl.addEventListener("input", applyFilter);
    header.append(searchEl);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "luma-artists-close";
    closeBtn.setAttribute("aria-label", "Close artists");
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.addEventListener("click", () => close());
    header.append(closeBtn);

    gridEl = document.createElement("div");
    gridEl.className = "luma-artists-grid";
    gridEl.setAttribute("role", "list");

    statusEl = document.createElement("div");
    statusEl.className = "luma-artists-status";

    panel.append(header, gridEl, statusEl);
    root.append(scrim, panel);
    document.body.append(root);

    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    });
  }

  function playArtist(artist) {
    const player = globalThis.Spicetify?.Player;
    if (player?.playUri) {
      player.playUri(`spotify:artist:${artist.id}`);
    }
  }

  function cardFor(artist) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "luma-artists-card";
    card.setAttribute("role", "listitem");
    card.dataset.name = artist.name.toLowerCase();
    card.dataset.letter = alphabetHeader(artist.name);
    const picture = document.createElement("span");
    picture.className = "luma-artists-picture";
    if (artist.image) {
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = "";
      img.src = artist.image;
      picture.append(img);
    } else {
      // Silent initial for artists without artwork.
      const initial = document.createElement("span");
      initial.className = "luma-artists-initial";
      initial.textContent = (artist.name[0] || "?").toUpperCase();
      picture.append(initial);
    }
    // Hover play: starts the artist's top tracks without leaving the page.
    // A span, not a button — nested <button> elements are invalid HTML.
    const play = document.createElement("span");
    play.className = "luma-artists-play";
    play.title = "Play";
    play.setAttribute("role", "button");
    play.tabIndex = 0;
    play.setAttribute("aria-label", `Play ${artist.name}`);
    play.innerHTML = PLAY_ICON;
    play.addEventListener("click", (event) => {
      event.stopPropagation();
      playArtist(artist);
    });
    play.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        playArtist(artist);
      }
    });
    picture.append(play);
    const name = document.createElement("span");
    name.className = "luma-artists-name";
    name.textContent = artist.name;
    card.append(picture, name);
    card.addEventListener("click", () => {
      close();
      const history = globalThis.Spicetify?.Platform?.History;
      if (history?.push) history.push(`/artist/${artist.id}`);
    });
    return card;
  }

  function render(artists) {
    countEl.textContent = artists.length ? String(artists.length) : "";
    // Letter sections: header row spanning the grid, then its cards.
    const groups = new Map();
    for (const artist of artists) {
      const letter = alphabetHeader(artist.name);
      let bucket = groups.get(letter);
      if (!bucket) {
        bucket = [];
        groups.set(letter, bucket);
      }
      bucket.push(artist);
    }
    const nodes = [];
    for (const [letter, bucket] of groups) {
      const heading = document.createElement("span");
      heading.className = "luma-artists-letter";
      heading.setAttribute("role", "presentation");
      heading.textContent = letter;
      heading.dataset.letter = letter;
      nodes.push(heading);
      for (const artist of bucket) nodes.push(cardFor(artist));
    }
    gridEl.replaceChildren(...nodes);
    statusEl.hidden = artists.length > 0;
    statusEl.textContent = "No artists match this filter.";
  }

  function applyFilter() {
    const query = (searchEl.value || "").trim().toLowerCase();
    const shown = new Set();
    for (const card of gridEl.querySelectorAll(".luma-artists-card")) {
      const match = !query || card.dataset.name.includes(query);
      card.hidden = !match;
      if (match) shown.add(card.dataset.letter);
    }
    for (const letter of gridEl.querySelectorAll(".luma-artists-letter")) {
      letter.hidden = !shown.has(letter.dataset.letter);
    }
    statusEl.hidden = shown.size > 0;
    statusEl.textContent = query
      ? "No artists match this filter."
      : "No artists in the library yet — follow some artists first.";
  }

  function status(message) {
    gridEl.replaceChildren();
    countEl.textContent = "";
    statusEl.hidden = false;
    statusEl.textContent = message;
  }

  async function open() {
    build();
    lastFocus = document.activeElement;
    root.hidden = false;
    try {
      const artists = await loadArtists();
      render(artists);
      applyFilter();
      searchEl.focus();
    } catch {
      status("Could not load artists — try again in a moment.");
    }
  }

  function close() {
    if (!root || root.hidden) return;
    root.hidden = true;
    searchEl.value = "";
    applyFilter();
    lastFocus?.focus?.();
  }

  return {
    open,
    close,
    count: () => data.count,
  };
}
