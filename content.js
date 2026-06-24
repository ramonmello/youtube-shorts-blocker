(() => {
  "use strict";

  if (window.__youtubeShortsBlockerInstalled) {
    return;
  }

  window.__youtubeShortsBlockerInstalled = true;

  const ACTIVE_CLASS = "ysb-active";
  const HIDDEN_ATTR = "data-ysb-hidden";
  const PREVIOUS_DISPLAY_ATTR = "data-ysb-previous-display";
  const PREVIOUS_DISPLAY_PRIORITY_ATTR = "data-ysb-previous-display-priority";
  const SHORTS_PATH_PATTERN = /^\/shorts(?:\/|$)/;

  const NAV_ITEM_SELECTOR = [
    "ytd-guide-entry-renderer",
    "ytd-guide-collapsible-entry-renderer",
    "ytd-mini-guide-entry-renderer"
  ].join(",");

  const SHELF_SELECTOR = [
    "ytd-reel-shelf-renderer",
    "ytd-rich-shelf-renderer",
    "ytd-rich-section-renderer",
    "ytd-horizontal-card-list-renderer",
    "ytd-shelf-renderer"
  ].join(",");

  const CARD_SELECTOR = [
    "ytd-reel-item-renderer",
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-playlist-video-renderer",
    "yt-lockup-view-model"
  ].join(",");

  const CONTROL_SELECTOR = [
    "yt-chip-cloud-chip-renderer",
    "ytd-button-renderer",
    "tp-yt-paper-item",
    "a"
  ].join(",");

  const CONTAINER_SELECTOR = [
    "ytd-rich-section-renderer",
    "ytd-rich-shelf-renderer",
    "ytd-reel-shelf-renderer",
    "ytd-horizontal-card-list-renderer",
    "ytd-shelf-renderer",
    "ytd-item-section-renderer"
  ].join(",");

  const ITEM_SELECTOR = [
    "ytd-reel-item-renderer",
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-playlist-video-renderer",
    "yt-lockup-view-model"
  ].join(",");

  let cleanupQueued = false;
  let lastUrl = location.href;

  function isShortsPage() {
    return SHORTS_PATH_PATTERN.test(location.pathname);
  }

  function setActiveState() {
    document.documentElement?.classList.toggle(ACTIVE_CLASS, !isShortsPage());
  }

  function isShortsUrl(value) {
    if (!value) {
      return false;
    }

    try {
      const url = new URL(value, location.origin);
      const isYouTubeHost = url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com");
      return isYouTubeHost && SHORTS_PATH_PATTERN.test(url.pathname);
    } catch {
      return false;
    }
  }

  function isShortsLink(link) {
    return isShortsUrl(link.getAttribute("href")) || isShortsUrl(link.href);
  }

  function isHiddenByExtension(element) {
    return element.hasAttribute(HIDDEN_ATTR);
  }

  function hideElement(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return;
    }

    if (!element.hasAttribute(HIDDEN_ATTR)) {
      element.setAttribute(PREVIOUS_DISPLAY_ATTR, element.style.getPropertyValue("display"));
      element.setAttribute(
        PREVIOUS_DISPLAY_PRIORITY_ATTR,
        element.style.getPropertyPriority("display")
      );
    }

    element.setAttribute(HIDDEN_ATTR, "");
    element.style.setProperty("display", "none", "important");
  }

  function restoreHiddenElements(root = document) {
    for (const element of root.querySelectorAll(`[${HIDDEN_ATTR}]`)) {
      const previousDisplay = element.getAttribute(PREVIOUS_DISPLAY_ATTR);
      const previousPriority = element.getAttribute(PREVIOUS_DISPLAY_PRIORITY_ATTR);

      element.removeAttribute(HIDDEN_ATTR);
      element.removeAttribute(PREVIOUS_DISPLAY_ATTR);
      element.removeAttribute(PREVIOUS_DISPLAY_PRIORITY_ATTR);

      if (previousDisplay) {
        element.style.setProperty("display", previousDisplay, previousPriority ?? "");
      } else {
        element.style.removeProperty("display");
      }
    }
  }

  function findShortsContainer(link) {
    const navItem = link.closest(NAV_ITEM_SELECTOR);
    if (navItem) {
      return navItem;
    }

    const reelShelf = link.closest("ytd-reel-shelf-renderer");
    if (reelShelf) {
      return reelShelf;
    }

    const card = link.closest(CARD_SELECTOR);
    if (card) {
      return card;
    }

    const control = link.closest(CONTROL_SELECTOR);
    if (control) {
      return control;
    }

    return link.closest(SHELF_SELECTOR);
  }

  function hideKnownShortsShelves(root) {
    const shelves = root.querySelectorAll?.("ytd-reel-shelf-renderer") ?? [];

    for (const shelf of shelves) {
      hideElement(shelf);
    }
  }

  function hideShortsLinks(root) {
    const links = root.querySelectorAll?.("a[href]") ?? [];

    for (const link of links) {
      if (!isShortsLink(link)) {
        continue;
      }

      hideElement(findShortsContainer(link));
    }
  }

  function isVisibleItem(element) {
    if (isHiddenByExtension(element)) {
      return false;
    }

    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function pruneEmptyContainers(root) {
    const containers = Array.from(root.querySelectorAll?.(CONTAINER_SELECTOR) ?? []);
    containers.reverse();

    for (const container of containers) {
      if (isHiddenByExtension(container)) {
        continue;
      }

      const items = Array.from(container.querySelectorAll(ITEM_SELECTOR));
      if (items.length > 0 && items.every((item) => !isVisibleItem(item))) {
        hideElement(container);
      }
    }
  }

  function cleanup(root = document) {
    setActiveState();

    if (isShortsPage()) {
      restoreHiddenElements();
      return;
    }

    hideKnownShortsShelves(root);
    hideShortsLinks(root);
    pruneEmptyContainers(root);
  }

  function queueCleanup(root = document) {
    if (cleanupQueued) {
      return;
    }

    cleanupQueued = true;

    requestAnimationFrame(() => {
      cleanupQueued = false;
      cleanup(root);
    });
  }

  function handleNavigation() {
    if (location.href === lastUrl) {
      return;
    }

    lastUrl = location.href;
    queueCleanup();
  }

  setActiveState();

  const observer = new MutationObserver((mutations) => {
    if (isShortsPage()) {
      setActiveState();
      restoreHiddenElements();
      return;
    }

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        queueCleanup();
        return;
      }
    }
  });

  observer.observe(document.documentElement ?? document, {
    childList: true,
    subtree: true
  });

  document.addEventListener("DOMContentLoaded", () => cleanup(), { once: true });
  document.addEventListener("yt-navigate-finish", handleNavigation);
  document.addEventListener("yt-page-data-updated", () => queueCleanup());
  window.addEventListener("popstate", handleNavigation);
  window.addEventListener("focus", handleNavigation);
  setInterval(handleNavigation, 1000);

  queueCleanup();
})();
