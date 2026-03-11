import { UserAction } from "../entities/UserAction.js";

console.log("hello world");
let act = new UserAction("click", null, null, "main");
act.setSourceMethod("test");
console.log(act);
