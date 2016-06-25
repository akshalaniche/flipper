import Game from "./game";
import configs from "./config";
import Setting from "./setting";
import Sempre from "./sempre";
import { getHistoryElems } from "./util";
const Awesomplete = require("awesomplete");

class App {
  constructor() {
    this.Game = new Game();
    this.Setting = new Setting();
    this.Sempre = new Sempre();
    this.consoleElem = document.getElementById(configs.consoleElemId);
    this.defineElem = document.getElementById(configs.defineElemId);
    this.defineState = false;
    this.activeHistoryElem = -1;
    this.awesomplete = {};

    /* Generate Target at Random */
    this.Game.setTarget(this.Game.getRandomTarget());
    this.setupAutocomplete();
  }

  enter() {
    if (this.defineState) {
      // TODO: Validate define length!
      const defined = this.Game.define(this.defineElem.value);
      if (defined) {
        this.defineState = false;
        this.defineElem.value = "";
        this.Setting.closeDefineInterface();
        this.consoleElem.value = defined;
        this.consoleElem.focus();
      }

      return;
    }

    if (this.activeHistoryElem > 0) {
      const historyElems = getHistoryElems();
      this.Game.history = this.Game.history.slice(0, historyElems.length - this.activeHistoryElem);
      this.activeHistoryElem = -1;
    }

    this.Game.enter(this.consoleElem.value);
    this.consoleElem.value = "";
  }

  accept() {
    this.Game.accept();
    this.consoleElem.focus();
  }

  clear() {
    this.Game.clear();
    this.consoleElem.focus();
  }

  next() {
    this.Game.next();
  }

  prev() {
    this.Game.prev();
  }

  openDefineInterface() {
    this.Setting.openDefineInterface(this.Game.query, this.Game.responses.length > 0, this.Game.taggedCover);
    this.defineState = true;
  }

  closeDefineInterface() {
    this.Setting.closeDefineInterface();
    this.Game.defineSuccess = "";
    this.defineState = false;
  }

  undo() {
    const historyElems = getHistoryElems();
    if (this.activeHistoryElem === historyElems.length - 1) {
      return;
    } else if (this.activeHistoryElem >= 0) {
      this.revert(this.activeHistoryElem + 1);
    } else if (historyElems.length > 1) {
      this.revert(1);
    }
  }

  redo() {
    if (this.activeHistoryElem === 0) {
      return;
    } else if (this.activeHistoryElem > 0) {
      this.revert(this.activeHistoryElem - 1);
    }
  }

  revert(index) {
    this.Game = this.Setting.revertHistory(index, this.Game);
    this.activeHistoryElem = index;
  }

  setupAutocomplete() {
    this.defineElem.addEventListener("input", this.onautocomplete.bind(this), false);
    this.defineElem.addEventListener("focus", this.onautocomplete.bind(this), false);

    this.awesomplete = new Awesomplete(this.defineElem,
      { minChars: 0,
        list: ["remove if top red", "add yellow",
         "add brown if has red or row = 3",
         "add yellow if row = 3",
         "repeat add yellow 3 times"],
        filter() { return true; },
      });
  }

  onautocomplete(e) {
    if (this.defineElem.value.endsWith(" ")) {
      this.autocomplete(this.defineElem.value);
    } else if (this.defineElem.value.length === 0) {
      this.autocomplete("");
    }
    e.stopPropagation();
  }

  autocomplete(prefix) {
    const cmdautocomp = `(autocomplete "${prefix}")`;
    const cmds = { q: cmdautocomp, sessionId: this.Game.sessionId };

    this.Sempre.query(cmds, (response) => {
      const autocomps = response.autocompletes;
      this.awesomplete.list = autocomps;
      this.awesomplete.open();
      this.awesomplete.evaluate();
    });
  }
}

const A = new App();

/* Event Listeners */

document.getElementById("dobutton").addEventListener("click", () => A.enter(), false);
document.getElementById("flyingaccept").addEventListener("click", () => A.accept(), false);
document.getElementById("prevbutton").addEventListener("click", () => A.prev(), false);
document.getElementById("nextbutton").addEventListener("click", () => A.next(), false);
document.getElementById("clear_button").addEventListener("click", () => A.clear(), false);
document.getElementById("paraphrase").addEventListener("click", () => A.openDefineInterface(), false);
document.getElementById(configs.consoleElemId).addEventListener("keyup", () => true);
document.getElementById("define_phrase_button").addEventListener("click", () => A.enter(), false);
document.getElementById("close_define_interface").addEventListener("click", () => A.closeDefineInterface(), false);

document.getElementById("command_history").addEventListener("click", (e) => {
  let index = 0;
  const type = e.target.getAttribute("data-type");
  if (!(type === "accept" || type === "initial")) { return; }
  index = getHistoryElems().length - parseInt(e.target.getAttribute("data-stepN"), 10) - 1;
  A.revert(index);
}, false);

/* Keyboard shortcuts */

const Hotkeys = {
  ENTER: "13",
  LEFT: "37",
  RIGHT: "39",
  UP: "38",
  DOWN: "40",
  UNDO: "90+ctrl",
  REDO: "90+shift+ctrl",
  TEACH: "68+ctrl",
  ESC: "27",
  SHIFTENTER: "13+shift",
};

window.onkeydown = (e) => {
  let key = "";
  key += e.keyCode;

  if (e.shiftKey) { key += "+shift"; }
  if (e.ctrlKey || e.metaKey) { key += "+ctrl"; }

  switch (key) {
    case Hotkeys.UP:
      e.preventDefault();
      A.prev();
      break;
    case Hotkeys.DOWN:
      e.preventDefault();
      A.next();
      break;
    case Hotkeys.SHIFTENTER:
      e.preventDefault();
      A.accept();
      break;
    case Hotkeys.ENTER:
      e.preventDefault();
      A.enter();
      break;
    case Hotkeys.TEACH:
      e.preventDefault();
      A.openDefineInterface();
      break;
    case Hotkeys.ESC:
      if (A.defineState) {
        A.closeDefineInterface();
      }
      break;
    case Hotkeys.UNDO:
      e.preventDefault();
      A.undo();
      break;
    case Hotkeys.REDO:
      e.preventDefault();
      A.redo();
      break;
    default:
  }
};
