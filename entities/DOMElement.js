export class DOMElement {
  constructor() {
    this.tag = '';
    this.id = '';
    this.title = '';
  }
  setElementData(element) {
    this.tag = element.tagName.toLowerCase();
    this.id = element.id || '';
    this.title = element.getAttribute('title') || '';
  }
  getAllElements(type) {
    return {
      type: type,
      elementData: {
        id: this.id,
        title: this.title,
        tagname: this.tag
      }
    };
  }
}

