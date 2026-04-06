export class ClickToPageTracker {
  constructor({
    onClickRecorded = null,
    onClickExpired = null,
    pendingTime = 3000
  } = {}) {
    this.onClickRecorded = onClickRecorded;
    this.onClickExpired = onClickExpired;
    this.pendingTime = pendingTime;

    this.pendingClick = null;
    this.pendingTimer = null;
    this.isStarted = false;

    this.handleClick = this.handleClick.bind(this);
  }

  start() {
    if (this.isStarted) {
      console.log('[ClickToPageTracker] already started');
      return;
    }

    document.addEventListener('click', this.handleClick, true);
    this.isStarted = true;

    console.log('[ClickToPageTracker] started');
  }

  stop() {
    if (!this.isStarted) {
      console.log('[ClickToPageTracker] not started');
      return;
    }

    document.removeEventListener('click', this.handleClick, true);
    this.clearPendingClick();
    this.isStarted = false;

    console.log('[ClickToPageTracker] stopped');
  }

  handleClick(event) {
    const clickedElement = event.target;
    if (!clickedElement) return;

    const clickInfo = this.buildClickInfo(clickedElement, event);

    this.pendingClick = clickInfo;
    this.resetPendingTimer();

    console.log('[ClickToPageTracker] click recorded:', {
      clickId: clickInfo.clickId,
      tagName: clickInfo.tagName,
      clickableTagName: clickInfo.clickableTagName,
      linkHref: clickInfo.linkHref,
      linkTarget: clickInfo.linkTarget,
      isBlankTarget: clickInfo.isBlankTarget,
      text: clickInfo.text
    });

    if (typeof this.onClickRecorded === 'function') {
      try {
        this.onClickRecorded(clickInfo);
      } catch (error) {
        console.error('[ClickToPageTracker] onClickRecorded error:', error);
      }
    }
  }

  buildClickInfo(clickedElement, event) {
    const clickableElement = this.findClickableElement(clickedElement);

    const linkElement =
      clickableElement?.closest?.('a[href]') ||
      clickedElement?.closest?.('a[href]') ||
      null;

    const buttonElement =
      clickableElement?.closest?.('button') ||
      clickedElement?.closest?.('button') ||
      null;

    const imageElement =
      clickedElement?.closest?.('img') ||
      (clickedElement?.tagName?.toLowerCase() === 'img' ? clickedElement : null);

    const clickInfo = {
      clickId: this.createClickId(),
      timestamp: Date.now(),

      // 原始點到的 element
      clickedElement,
      tagName: clickedElement?.tagName || null,

      // 推測真正可互動的 element
      clickableElement: clickableElement || null,
      clickableTagName: clickableElement?.tagName || null,

      // link 資訊
      linkElement: linkElement || null,
      linkHref: this.safeGetHref(linkElement),
      linkTarget: linkElement?.getAttribute?.('target') || null,
      isBlankTarget: linkElement?.getAttribute?.('target') === '_blank',

      // button / img 輔助資訊
      buttonElement: buttonElement || null,
      imageElement: imageElement || null,
      isLinkClick: !!linkElement,
      isButtonClick: !!buttonElement,
      isImageClick: !!imageElement,

      // 修飾鍵
      ctrlKey: !!event?.ctrlKey,
      metaKey: !!event?.metaKey,
      shiftKey: !!event?.shiftKey,
      altKey: !!event?.altKey,
      button: event?.button ?? null,

      // 顯示 / debug 用
      text: this.extractText(clickableElement || clickedElement),
      selectorHint: this.buildSelectorHint(clickableElement || clickedElement),

      // 給後續 tracker 做判斷
      probableOutcome: this.inferProbableOutcome({
        linkElement,
        event
      })
    };

    return clickInfo;
  }

  findClickableElement(element) {
    if (!element) return null;

    const clickable = element.closest?.(
      'a[href], button, [role="button"], [onclick], input[type="button"], input[type="submit"]'
    );

    return clickable || element;
  }

  inferProbableOutcome({ linkElement, event }) {
    if (linkElement) {
      const target = linkElement.getAttribute('target');

      if (target === '_blank') {
        return 'new-page';
      }

      return 'same-page-or-router-navigation';
    }

    if (event?.ctrlKey || event?.metaKey) {
      return 'possible-new-tab';
    }

    return 'unknown';
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

      const alt = element.getAttribute?.('alt');
      if (alt) return alt.trim();

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

  buildSelectorHint(element) {
    if (!element) return null;

    try {
      const tagName = element.tagName?.toLowerCase?.() || 'unknown';

      if (element.id) {
        return `${tagName}#${element.id}`;
      }

      const className =
        typeof element.className === 'string'
          ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.')
          : '';

      if (className) {
        return `${tagName}.${className}`;
      }

      const role = element.getAttribute?.('role');
      if (role) {
        return `${tagName}[role="${role}"]`;
      }

      return tagName;
    } catch (error) {
      return null;
    }
  }

  getPendingClick() {
    return this.pendingClick;
  }

  consumePendingClick() {
    const clickInfo = this.pendingClick;
    this.clearPendingClick();
    return clickInfo;
  }

  clearPendingClick() {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }

    this.pendingClick = null;
  }

  resetPendingTimer() {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
    }

    this.pendingTimer = setTimeout(() => {
      const expiredClick = this.pendingClick;

      this.pendingClick = null;
      this.pendingTimer = null;

      console.log('[ClickToPageTracker] pending click expired:', expiredClick?.clickId);

      if (expiredClick && typeof this.onClickExpired === 'function') {
        try {
          this.onClickExpired(expiredClick);
        } catch (error) {
          console.error('[ClickToPageTracker] onClickExpired error:', error);
        }
      }
    }, this.pendingTime);
  }

  createClickId() {
    return `click_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}