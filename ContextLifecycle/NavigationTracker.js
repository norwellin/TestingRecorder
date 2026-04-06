export class NavigationTracker {
  constructor({
    onNavigationDetected = null,
    onLinkClickDetected = null,
    navigationCheckDelay = 300
  } = {}) {
    this.onNavigationDetected = onNavigationDetected;
    this.onLinkClickDetected = onLinkClickDetected;
    this.navigationCheckDelay = navigationCheckDelay;

    this.originalPushState = null;
    this.originalReplaceState = null;

    this.lastUrl = null;
    this.isStarted = false;

    this.handlePopState = this.handlePopState.bind(this);
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
  }

  start() {
    if (this.isStarted) {
      console.log('[NavigationTracker] already started');
      return;
    }

    this.lastUrl = this.getCurrentUrl();

    this.overrideHistoryMethods();
    window.addEventListener('popstate', this.handlePopState);
    window.addEventListener('hashchange', this.handleHashChange);
    document.addEventListener('click', this.handleDocumentClick, true);

    this.isStarted = true;
    console.log('[NavigationTracker] started');
  }

  stop() {
    if (!this.isStarted) {
      console.log('[NavigationTracker] not started');
      return;
    }

    this.restoreHistoryMethods();
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('hashchange', this.handleHashChange);
    document.removeEventListener('click', this.handleDocumentClick, true);

    this.isStarted = false;
    console.log('[NavigationTracker] stopped');
  }

  overrideHistoryMethods() {
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;

    const self = this;

    history.pushState = function (...args) {
      const previousUrl = self.getCurrentUrl();
      const result = self.originalPushState.apply(history, args);

      self.checkNavigation({
        source: 'pushState',
        previousUrlCandidate: previousUrl
      });

      return result;
    };

    history.replaceState = function (...args) {
      const previousUrl = self.getCurrentUrl();
      const result = self.originalReplaceState.apply(history, args);

      self.checkNavigation({
        source: 'replaceState',
        previousUrlCandidate: previousUrl
      });

      return result;
    };
  }

  restoreHistoryMethods() {
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
      this.originalPushState = null;
    }

    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }
  }

  handlePopState() {
    this.checkNavigation({
      source: 'popstate'
    });
  }

  handleHashChange() {
    this.checkNavigation({
      source: 'hashchange'
    });
  }

  handleDocumentClick(event) {
    const link = event.target?.closest?.('a[href]');
    if (!link) return;

    const linkInfo = this.buildLinkInfo(link, event);

    console.log('[NavigationTracker] link click detected:', linkInfo);

    if (typeof this.onLinkClickDetected === 'function') {
      try {
        this.onLinkClickDetected(linkInfo);
      } catch (error) {
        console.error('[NavigationTracker] onLinkClickDetected error:', error);
      }
    }

    // 對一般 link click，延遲一點再檢查 URL 有沒有變
    setTimeout(() => {
      this.checkNavigation({
        source: 'link-click',
        previousUrlCandidate: linkInfo.currentUrl,
        trigger: linkInfo
      });
    }, this.navigationCheckDelay);
  }

  buildLinkInfo(linkElement, event = null) {
    return {
      href: this.safeGetHref(linkElement),
      target: linkElement?.getAttribute?.('target') || null,
      rel: linkElement?.getAttribute?.('rel') || null,
      text: this.extractText(linkElement),
      currentUrl: this.getCurrentUrl(),
      isBlankTarget: linkElement?.getAttribute?.('target') === '_blank',
      ctrlKey: !!event?.ctrlKey,
      metaKey: !!event?.metaKey,
      shiftKey: !!event?.shiftKey,
      altKey: !!event?.altKey,
      button: event?.button ?? null
    };
  }

  checkNavigation({
    source = 'unknown',
    previousUrlCandidate = null,
    trigger = null
  } = {}) {
    const currentUrl = this.getCurrentUrl();
    const previousUrl = previousUrlCandidate || this.lastUrl;

    if (!currentUrl) {
      return;
    }

    if (currentUrl === this.lastUrl) {
      return;
    }

    const navigationInfo = {
      navigationId: this.createNavigationId(),
      source,
      previousUrl,
      currentUrl,
      timestamp: Date.now(),
      trigger
    };

    this.lastUrl = currentUrl;

    console.log('[NavigationTracker] navigation detected:', navigationInfo);

    if (typeof this.onNavigationDetected === 'function') {
      try {
        this.onNavigationDetected(navigationInfo);
      } catch (error) {
        console.error('[NavigationTracker] onNavigationDetected error:', error);
      }
    }
  }

  getCurrentUrl() {
    try {
      return window.location.href;
    } catch (error) {
      return null;
    }
  }

  getLastTrackedUrl() {
    return this.lastUrl;
  }

  safeGetHref(linkElement) {
    try {
      return linkElement?.href || null;
    } catch (error) {
      return null;
    }
  }

  extractText(element) {
    if (!element) return null;

    try {
      const ariaLabel = element.getAttribute?.('aria-label');
      if (ariaLabel) return ariaLabel.trim();

      const title = element.getAttribute?.('title');
      if (title) return title.trim();

      const text = element.textContent?.trim();
      if (text) {
        return text.replace(/\s+/g, ' ').slice(0, 120);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  createNavigationId() {
    return `nav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}