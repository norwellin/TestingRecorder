export class WindowsCatcher {
    constructor(doucumentRef = document) {
        this.documentRef = doucumentRef;
    }   
    catch(){
        const iframe = this.documentRef.querySelector('iframe');
        const iframeWindow = iframe?.contentWindow || null;
        const mainWindow = window;

        return {mainWindow, iframeWindow};
    }
}