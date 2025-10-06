import { PlaywrightCommand } from "./entities/PlaywrightCommand";

export class WindowsCatcher {
    constructor(doucumentRef = document) {
        this.documentRef = doucumentRef;
        this.iframeWindowsId = [];
    }   
    getWindows(){
        /*
        const iframes = this.documentRef.querySelectorAll('iframe');
        const iframeLen = iframes.length;
        let iframeWindows = {};
        console.log("iframes: ",iframes);
        if(iframeLen){
            iframes.forEach((el,index)=>{
                iframeWindows["iframe"+(index + 1)] = el.contentWindow;
            });
        }
        else 
            iframeWindows = null;
        const mainWindow = window;
        console.log("iframeWindows: ",iframeWindows);
        //return {mainWindow, iframeWindows};
        */
       
        const iframe = this.documentRef.querySelector('iframe');
        this.iframeWindowsId.push(iframe.id);
        const anotherIframe = this.documentRef.querySelectorAll('iframe');

        const iframeWindows = iframe?.contentWindow || null;
        const mainWindow = window;

        return {mainWindow, iframeWindows};
    }
    getIframesId(){
        return this.iframeWindowsId;
    }
}