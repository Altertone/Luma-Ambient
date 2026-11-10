/* Luma Ambient — shared UI helpers: modal dialog and toast.
 * Styled with the same --md-* tokens as the theme, with static fallbacks.
 */
const UI_CSS = `
#luma-ambient-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(12px);opacity:0;z-index:1000002;pointer-events:none;padding:10px 14px;border-radius:var(--md-shape-full,999px);background:color-mix(in srgb,var(--md-surface-container-high,#211f26) 92%,transparent);color:var(--md-on-surface,#f3edf7);border:1px solid color-mix(in srgb,var(--md-primary,#d0bcff) 25%,transparent);font:600 13px/1.2 var(--md-font,Inter);box-shadow:var(--md-elevation-2,0 2px 6px rgb(0 0 0 / 15%));backdrop-filter:blur(14px);transition:opacity .18s ease,transform .18s ease}
#luma-ambient-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#luma-ambient-scrim{position:fixed;inset:0;z-index:1000001;display:grid;place-items:center;background:var(--md-scrim,rgb(0 0 0 / 60%));opacity:0;transition:opacity .18s ease}
#luma-ambient-scrim.show{opacity:1}
#luma-ambient-scrim .luma-setup{width:min(380px,calc(100vw - 48px));max-height:calc(100vh - 48px);overflow:auto;padding:24px 24px 20px;border-radius:var(--md-shape-lg,16px);background:var(--md-surface-container,#1d1b20);border:1px solid var(--md-outline-variant,color-mix(in srgb,var(--md-on-surface,#f3edf7) 14%,transparent));box-shadow:var(--md-elevation-3,0 4px 8px rgb(0 0 0 / 15%));color:var(--md-on-surface,#f3edf7);font-family:var(--md-font,Inter);transform:translateY(8px) scale(.98);transition:transform .18s ease}
#luma-ambient-scrim.show .luma-setup{transform:none}
#luma-ambient-scrim h2{margin:0 0 8px;font-size:15px;font-weight:650;letter-spacing:-.02em}
#luma-ambient-scrim p{margin:0 0 18px;font-size:13px;line-height:1.55;color:var(--md-on-surface-variant,#cac4d0)}
#luma-ambient-scrim .luma-setup-hint{display:none;margin:-10px 0 14px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--md-primary,#d0bcff)}
#luma-ambient-scrim .luma-setup-hint.visible{display:block}
#luma-ambient-scrim .luma-setup-actions{display:flex;gap:8px}
#luma-ambient-scrim .luma-setup-actions button{flex:1;padding:9px 14px;border-radius:var(--md-shape-sm,8px);font:600 13px/1 var(--md-font,Inter);cursor:pointer;transition:filter .15s ease,background-color .15s ease,border-color .15s ease}
#luma-ambient-scrim .luma-setup-yes{border:1px solid transparent;background:var(--md-primary,#d0bcff);color:var(--md-on-primary,#241a30)}
#luma-ambient-scrim .luma-setup-yes:hover{filter:brightness(1.08)}
#luma-ambient-scrim .luma-setup-no{border:1px solid color-mix(in srgb,var(--md-on-surface,#f3edf7) 22%,transparent);background:transparent;color:var(--md-on-surface,#f3edf7);font-weight:500}
#luma-ambient-scrim .luma-setup-no:hover{background:var(--md-state-hover,color-mix(in srgb,var(--md-primary,#d0bcff) 8%,transparent))}
#luma-ambient-scrim .luma-field{display:grid;gap:6px;margin:0 0 14px}
#luma-ambient-scrim .luma-field[hidden]{display:none}
#luma-ambient-scrim .luma-field>label{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--md-on-surface-variant,#cac4d0)}
#luma-ambient-scrim .luma-field select{width:100%;padding:9px 10px;border-radius:var(--md-shape-sm,8px);border:1px solid var(--md-outline,#575260);background:var(--md-surface-container-highest,#2b2930);color:var(--md-on-surface,#f3edf7);font:500 13px/1.2 var(--md-font,Inter)}
#luma-ambient-scrim .luma-field input[type=color]{width:100%;height:38px;padding:3px;border-radius:var(--md-shape-sm,8px);border:1px solid var(--md-outline,#575260);background:var(--md-surface-container-highest,#2b2930);cursor:pointer}
#luma-ambient-scrim .luma-field input[type=range]{width:100%;accent-color:var(--md-primary,#d0bcff)}
#luma-ambient-scrim .luma-field output{font-size:12px;color:var(--md-on-surface-variant,#cac4d0)}
#luma-ambient-scrim .luma-swatches{display:flex;gap:6px;margin:0 0 18px}
#luma-ambient-scrim .luma-swatches span{flex:1;height:22px;border-radius:var(--md-shape-xs,4px);border:1px solid var(--md-outline-variant,#36323c)}
#luma-ambient-scrim :where(button,select,input):focus-visible{outline:2px solid var(--md-primary,#d0bcff);outline-offset:2px}
@media (prefers-reduced-motion: reduce) {
  #luma-ambient-scrim,#luma-ambient-scrim .luma-setup,#luma-ambient-toast{transition:none}
}
`;

let styleInjected = false;
export function injectUiStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const styleEl = document.createElement("style");
  styleEl.id = "luma-ambient-setup-ui";
  styleEl.textContent = UI_CSS;
  document.head.append(styleEl);
}

let toastTimer = 0;
export function showToast(message) {
  injectUiStyle();
  let toastEl = document.getElementById("luma-ambient-toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "luma-ambient-toast";
    document.body.append(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

/**
 * Open the modal and let `build(box, close)` fill it. Escape or a click on the
 * backdrop closes it. Returns the close function, or null if one is already open.
 */
export function openModal(label, build) {
  injectUiStyle();
  if (document.getElementById("luma-ambient-scrim")) return null;
  const previousFocus = document.activeElement;

  const scrim = document.createElement("div");
  scrim.id = "luma-ambient-scrim";
  const box = document.createElement("div");
  box.className = "luma-setup";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", label);
  scrim.append(box);

  const onKeydown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  };
  function close() {
    scrim.classList.remove("show");
    const done = () => scrim.remove();
    scrim.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 400); // reduced-motion fallback
    document.removeEventListener("keydown", onKeydown, true);
    previousFocus?.focus?.();
  }

  scrim.addEventListener("click", (event) => {
    if (event.target === scrim) close();
  });
  document.body.append(scrim);
  requestAnimationFrame(() => scrim.classList.add("show"));
  document.addEventListener("keydown", onKeydown, true);
  build(box, close);
  return close;
}
