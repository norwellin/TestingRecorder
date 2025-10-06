import { WindowsCatcher } from './WindowsCatcher.js';


export class ComTester{
    constructor(){

    }
    windowCatcherTester(){
        let allwindows = new WindowsCatcher();
        allwindows.getWindows();
    }
}