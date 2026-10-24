/* scb-direct-paste: forward local pastes to the remote clipboard, then
 * re-send Ctrl+V so ONE user press pastes.
 * Why the re-send is needed (race): when the user presses Ctrl+V, the
 * KasmVNC client's keydown handler (listening on #noVNC_keyboardinput,
 * the RFB keyboard input) forwards the chord to the remote app at once,
 * but the browser only fires the paste event afterwards, and only then
 * does the synced text reach the server clipboard. The re-send below
 * (150 ms later) lands after the sync, so one press pastes.
 */
(function () {
  function syncText(text) {
    try {
      var box = document.getElementById('noVNC_clipboard_text');
      if (box) {
        box.value = text;
        var ev;
        try { ev = new Event('change', { bubbles: true }); }
        catch (e) { ev = document.createEvent('Event'); ev.initEvent('change', true, false); }
        box.dispatchEvent(ev);
        return true;
      }
    } catch (e) {}
    try {
      var names = ['UI', 'noVNC', 'vnc'];
      for (var i = 0; i < names.length; i++) {
        var obj = window[names[i]];
        if (obj && typeof obj.clipboardPasteFrom === 'function') { obj.clipboardPasteFrom(text); return true; }
        if (obj && obj.rfb && typeof obj.rfb.clipboardPasteFrom === 'function') { obj.rfb.clipboardPasteFrom(text); return true; }
      }
    } catch (e) {}
    return false;
  }
  function makeKeyEvent(type) {
    var init = { key: 'v', code: 'KeyV', ctrlKey: true, bubbles: true, cancelable: true };
    var ev;
    try { ev = new KeyboardEvent(type, init); }
    catch (e) {
      ev = document.createEvent('Event');
      ev.initEvent(type, true, true);
      ev.key = 'v'; ev.code = 'KeyV'; ev.ctrlKey = true;
    }
    try { Object.defineProperty(ev, 'keyCode', { value: 86 }); } catch (e) {}
    try { Object.defineProperty(ev, 'which', { value: 86 }); } catch (e) {}
    return ev;
  }
  function resendCtrlV() {
    try {
      var target = document.getElementById('noVNC_keyboardinput') || document.activeElement || document;
      target.dispatchEvent(makeKeyEvent('keydown'));
      setTimeout(function () { try { target.dispatchEvent(makeKeyEvent('keyup')); } catch (e) {} }, 50);
    } catch (e) {}
  }
  document.addEventListener('paste', function (e) {
    try {
      var data = e.clipboardData || window.clipboardData;
      if (!data) return;
      var text = data.getData('text/plain') || data.getData('text');
      if (text && syncText(text)) { setTimeout(resendCtrlV, 150); }
    } catch (e) {}
  }, true);
})();
