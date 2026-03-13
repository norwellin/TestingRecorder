export class WindowsCatcher {
  constructor(doc = document, win = window) {
    this.documentRef = doc;
    this.windowRef = win;
  }

  getWindows() {
    const iframeElement = this.documentRef.querySelector('iframe') || null;
    const mainWindow = this.windowRef || null;
    const iframeWindow = iframeElement?.contentWindow || null;
    const iframeId = iframeElement?.id || null;

    return {
      mainWindow,
      iframeWindow,
      iframeElement,
      iframeId
    };
  }

  getIframesId() {
    const iframeElement = this.documentRef.querySelector('iframe') || null;
    return iframeElement?.id || null;
  }

  hasMainWindow() {
    return !!this.windowRef;
  }

  hasIframeWindow() {
    const iframeElement = this.documentRef.querySelector('iframe') || null;
    return !!iframeElement?.contentWindow;
  }
}