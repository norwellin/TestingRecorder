export class WindowsCatcher {
    constructor(doucumentRef = document) {
        this.documentRef = doucumentRef;
    }   
    getWindows(){
        /*
        const iframes = this.documentRef.querySelectorAll('iframe');
        const iframeLen = iframes.length;
        let iframeWindows;
        console.log("iframes: ",iframes);
        if(iframeLen)
            iframeWindows = Array.from(iframes).map(iframe => iframe.contentWindow);
        else 
            iframeWindows = null;
        const mainWindow = window;
        console.log("iframeWindows: ",iframeWindows);
        return {mainWindow, iframeWindows};
        */
        const iframe = this.documentRef.querySelector('iframe');
        const iframeWindow = iframe?.contentWindow || null;
        const mainWindow = window;

        return {mainWindow, iframeWindow};
    }
}