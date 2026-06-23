// 修正檔案名稱路徑
import "./source/browserGlobalShim.js";
import { MainApp } from "./MainApp.js"; 
import { setupRecorderBridge } from "./setupRecorderBridge.js";

setupRecorderBridge({ MainApp });
