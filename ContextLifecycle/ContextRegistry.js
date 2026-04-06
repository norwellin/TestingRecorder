export class ContextRegistry {
  constructor() {
    this.contextMap = new Map();
  }

  // ===== 註冊 =====
  register(context) {
    if (!context?.contextId) return null;

    const normalizedContext = {
      children: [],
      ...context
    };

    // 確保 children 一定是陣列
    if (!Array.isArray(normalizedContext.children)) {
      normalizedContext.children = [];
    }

    this.contextMap.set(normalizedContext.contextId, normalizedContext);
    return normalizedContext;
  }

  registerMany(contexts = []) {
    const results = [];
    contexts.forEach((context) => {
      const registered = this.register(context);
      if (registered) {
        results.push(registered);
      }
    });
    return results;
  }

  // ===== 查詢 =====
  hasContext(contextId) {
    if (!contextId) return false;
    return this.contextMap.has(contextId);
  }

  getContext(contextId) {
    if (!contextId) return null;
    return this.contextMap.get(contextId) || null;
  }

  getAllContexts() {
    return Array.from(this.contextMap.values());
  }

  getContextsByType(type) {
    return this.getAllContexts().filter((ctx) => ctx.type === type);
  }

  getRootContexts() {
    return this.getAllContexts().filter((ctx) => !ctx.parentContextId);
  }

  // ===== 關係查詢 =====
  getParent(contextId) {
    const context = this.getContext(contextId);
    if (!context?.parentContextId) return null;
    return this.getContext(context.parentContextId);
  }

  getChildren(contextId) {
    const context = this.getContext(contextId);
    if (!context || !Array.isArray(context.children)) return [];

    return context.children
      .map((childId) => this.getContext(childId))
      .filter(Boolean);
  }

  getPath(contextId) {
    const path = [];
    let current = this.getContext(contextId);

    while (current) {
      path.unshift(current);
      if (!current.parentContextId) break;
      current = this.getContext(current.parentContextId);
    }

    return path;
  }

  getPathIds(contextId) {
    return this.getPath(contextId).map((ctx) => ctx.contextId);
  }

  getPathNames(contextId) {
    return this.getPath(contextId).map((ctx) => ctx.name);
  }

  // ===== 更新 =====
  updateContext(contextId, patch = {}) {
    const existing = this.getContext(contextId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...patch
    };

    // children 若被更新，仍保證為陣列
    if (!Array.isArray(updated.children)) {
      updated.children = [];
    }

    this.contextMap.set(contextId, updated);
    return updated;
  }

  // ===== 刪除 =====
  removeContext(contextId) {
    const target = this.getContext(contextId);
    if (!target) return false;

    // 先把它從 parent.children 裡移掉
    if (target.parentContextId) {
      const parent = this.getContext(target.parentContextId);
      if (parent) {
        parent.children = parent.children.filter((id) => id !== contextId);
        this.contextMap.set(parent.contextId, parent);
      }
    }

    // 遞迴移除 children
    const children = [...(target.children || [])];
    children.forEach((childId) => {
      this.removeContext(childId);
    });

    this.contextMap.delete(contextId);
    return true;
  }

  clear() {
    this.contextMap.clear();
  }

  // ===== debug =====
  printTree() {
    const roots = this.getRootContexts();
    roots.forEach((root) => {
      this.printSubTree(root.contextId, 0);
    });
  }

  printSubTree(contextId, depth = 0) {
    const context = this.getContext(contextId);
    if (!context) return;

    const indent = '  '.repeat(depth);
    console.log(
      `${indent}- ${context.name} [${context.type}] (${context.contextId})`
    );

    (context.children || []).forEach((childId) => {
      this.printSubTree(childId, depth + 1);
    });
  }
}