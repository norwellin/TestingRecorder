// 監聽外部 drag-drop 事件
export class OuterEventListener {
  constructor(iframeWindow) {
    this.iframeWindow = iframeWindow;
    this.dragSources = document.querySelectorAll('[draggable="true"]');

    //
    this.target = null;
    this.source = null;
  }

  init() {
    this.dragSources.forEach((dragSource) => {
        dragSource.addEventListener('dragstart', (e) => {
        console.log('拖曳開始:', dragSource);
        this.iframeWindow.postMessage({
          type: 'dragstart',
          target: e.target
        }, '*');
        this.source = e.target.getAttribute('title');
      });

      dragSource.addEventListener('dragend', () => {
        console.log('拖曳end:');
      });
    });


  }
}
