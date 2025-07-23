(function () {
  const iframe = document.querySelector('iframe');

  if (!iframe) {
    console.error('找不到 iframe');
    return;
  }
  console.log("程式活著!");

  // iframe 載入完成後再綁定事件
 
  const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframeWindow.document;

  let currentHoveredElement = null;

  iframeDocument.addEventListener('mousemove', (e) => {
    currentHoveredElement = e.target;
  });
  iframeDocument.addEventListener('mouseup', (e) => {
    console.log("mouseup", e.target);
  });







    // iframe 內部建立 listener 以接收外部訊號
    iframeWindow.addEventListener('message', (e) => {
      if (e.data === 'mouseup-from-parent') {
        console.log('iframe 收到 parent 傳來的 mouseup');
        if (currentHoveredElement) {
          console.log(currentHoveredElement);
          const path = getDomPath(currentHoveredElement);
          console.log('滑鼠停留在 iframe 中的元素:', path);
          currentHoveredElement = null;
        }

      }
    });

  const dragSources = document.querySelectorAll('[draggable="true"]');
  const dropTarget = iframeWindow;
dragSources.forEach(dragSource => {
  dragSource.addEventListener('dragstart', (e) => {
    console.log('拖曳開始:', dragSource);
  });
});
  dropTarget.addEventListener('dragover', (e) => {
    e.preventDefault(); // ❗️一定要加，不然 drop 不會觸發
    console.log('拖曳滑過目標區');
  });

  dropTarget.addEventListener('drop', (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    console.log('放開了:', data);
    iframe.contentWindow.postMessage('mouseup-from-parent', '*');
  });

dragSources.forEach(dragSource => {
  dragSource.addEventListener('dragend', (e) => {
    console.log('拖曳end:');
  });
});

  function getDomPath(el) {
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let name = el.nodeName.toLowerCase();
      if (el.id) {
        name += `#${el.id}`;
        path.unshift(name);
        break;
      } else {
        let siblingIndex = 1;
        let sibling = el;
        while ((sibling = sibling.previousElementSibling)) {
          if (sibling.nodeName === el.nodeName) {
            siblingIndex++;
          }
        }
        if (siblingIndex > 1) {
          name += `:nth-of-type(${siblingIndex})`;
        }
        path.unshift(name);
        el = el.parentElement;
      }
    }
    return path.join(' > ');
  }
})();
