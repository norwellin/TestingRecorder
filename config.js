export const DIALOG_SELECTORS = [
  '[role="dialog"]',          // 標準 WAI-ARIA 對話框
  '.modal',                   // 常見 class 名稱
  'dialog',                   // 原生 <dialog> 元素
  '.gjs-mdl-container',       // GrapesJS
  '.gjs-mdl-dialog',          // GrapesJS
  '.ant-modal',               // Ant Design
  '.MuiDialog-root',          // Material UI
  '.chakra-modal__content',   // Chakra UI
  '.ion-modal',               // Ionic Framework
  '.swal2-popup',             // SweetAlert2
  'div.gjs-mdl-content'
];