(function () {
  try {
    var k = "ccf-theme";
    var v = [
      "makati",
      "session",
      "neon",
      "cosmos",
      "emerald",
      "sunset",
      "fintech",
      "material",
      "cupertino",
      "smarthome",
      "travel",
    ];
    var s = localStorage.getItem(k);
    if (s && v.indexOf(s) >= 0) {
      document.documentElement.setAttribute("data-theme", s);
      return;
    }
    var p = location.pathname;
    var q = p === "/quick-game" || p === "/play" || p.indexOf("/play/") === 0;
    document.documentElement.setAttribute("data-theme", q ? "material" : "smarthome");
  } catch (e) {}
})();
