export class HoverInspector {
  constructor(doc, win, options = {}) {
    this.doc = doc;
    this.win = win;
    this.color = options.color || "#ff5fb7";
    this.box = null;
    this.label = null;
    this.create();
  }

  create() {
    if (!this.doc?.documentElement) return;

    this.box = this.doc.createElement("div");
    this.label = this.doc.createElement("div");

    Object.assign(this.box.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "2147483647",
      border: `2px solid ${this.color}`,
      outline: "1px dashed rgba(126, 66, 255, 0.9)",
      outlineOffset: "-4px",
      background: "rgba(255, 95, 183, 0.14)",
      boxSizing: "border-box",
      display: "none"
    });

    Object.assign(this.label.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "2147483647",
      maxWidth: "80vw",
      padding: "4px 8px",
      fontSize: "12px",
      lineHeight: "18px",
      fontFamily: "Consolas, Monaco, monospace",
      color: "#4a2340",
      background: "#fff0f7",
      border: "1px solid #ff9fd1",
      borderRadius: "3px",
      boxShadow: "0 2px 10px rgba(255, 95, 183, 0.28)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "none"
    });

    this.doc.documentElement.appendChild(this.box);
    this.doc.documentElement.appendChild(this.label);
  }

  show(element, text) {
    if (!this.box || !this.label || !element || element === this.box || element === this.label) return;

    const rect = element.getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    Object.assign(this.box.style, {
      display: "block",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });

    this.label.textContent = text || "";
    const labelTop = rect.bottom + 6 > this.win.innerHeight - 28
      ? Math.max(0, rect.top - 30)
      : rect.bottom + 6;

    Object.assign(this.label.style, {
      display: text ? "block" : "none",
      left: `${Math.max(0, Math.min(rect.left, this.win.innerWidth - 40))}px`,
      top: `${labelTop}px`
    });
  }

  hide() {
    if (this.box) this.box.style.display = "none";
    if (this.label) this.label.style.display = "none";
  }
}
