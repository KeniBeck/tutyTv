import globals from "globals";

export default [{
  files: ["source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js"],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "script",
    globals: {
      ...globals.browser,
      Hls: "readonly",
      TUTYTV_WEB: "readonly",
      palmSystem: "readonly",
      PalmSystem: "readonly",
      webOS: "readonly",
      __tutyHls: "writable",
      __tutyPreviewHls: "writable"
    }
  },
  rules: {
    "no-undef": "error",
    "no-unused-vars": ["error", {
      "vars": "all",
      "args": "none",
      "caughtErrors": "none"
    }]
  }
}];
