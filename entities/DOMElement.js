export class DOMElement {
  constructor() {
    this.tag = '';
    this.id = '';
    this.title = '';
    this.event = null;
    this.type = '';
  }
  setElementData(element, type) {
    this.type = type;
    this.tag = element.tagName.toLowerCase();
    this.id = element.id || '';
    this.title = element.getAttribute('title') || '';
    this.event = element;
  }
  getAllElements() {
    return {
      type: this.type,
      elementData: {
        id: this.id,
        title: this.title,
        tagname: this.tag
      },
      event: this.event
    };
  }
  resetElement(){
    this.tag = '';
    this.id = '';
    this.title = '';
    this.event = null;
  }
}

