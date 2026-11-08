import plugin from "./plugin.json";
import style from "./style.scss";
import customStyle from "./customStyles.scss";

const themes = acode.require("themes");
const ThemeBuilder = acode.require("themeBuilder");
const settings = acode.require("settings");
const sidebarApps = acode.require("sidebarApps");
const toInternalUrl = acode.require("toInternalUrl");
const fs = acode.require("fsOperation");
const editorThemes = acode.require("editorThemes");

const { editor } = editorManager;
const editorThemeName = "dark-amoled";
const legacyAceThemePath = `ace/theme/${editorThemeName}`;
const codeMirrorDarkThemeId = "dark-amoled";

function isCodeMirrorEngine() {
  return editorManager && editorManager.isCodeMirror === true;
}

function defineAceTheme() {
  if (typeof ace === "undefined" || typeof ace.define !== "function") {
    return false;
  }

  ace.define(
    `ace/theme/${editorThemeName}.css`,
    ["require", "exports", "module"],
    function (require, exports, module) {
      module.exports = style;
    },
  );

  ace.define(
    `ace/theme/${editorThemeName}`,
    [
      "require",
      "exports",
      "module",
      `ace/theme/${editorThemeName}.css`,
      "ace/lib/dom",
    ],
    function (require, exports, module) {
      exports.isDark = true;
      exports.cssClass = `ace-${editorThemeName}`;
      exports.cssText = require(`./${editorThemeName}.css`);
      const dom = require("../lib/dom");
      dom.importCssString(exports.cssText, exports.cssClass, false);
    },
  );

  if (typeof window.require === "function") {
    window.require([legacyAceThemePath], function (m) {
      if (typeof module === "object" && typeof exports === "object" && module) {
        module.exports = m;
      }
    });
  }

  return true;
}

const palette = {
  // Accent colour
  active_color: "#179FFF",
  active_text: "#309BFF",
  active_icon: "#2E2E2E",
  active_line: "#3E4959",

  border: "#121212",

  shadow: "#5C5C5C40",

  button_active: "#8F7CFF",
  button_bg: "#8F7CFF",
  button_text: "#292349",

  error_text: "#ED0924",

  primary: "#070707",
  primary_text: "#FFFFFF",

  secondary: "#000000",
  secondary_text: "#E3E3E3",

  link: "#615EFD",

  scrollbar: "#556273",

  popup_border: "#3A3A3A",
  popup_icon: "#DFE7F2",
  popup_bg: "#090909",
  popup_text: "#E3E3E3",
  popup_active: "#179FFF",

  danger: "#A10618",

  // Editor
  text: "#DFE7F2",
  muted: "#556273",
  key_word: "#5C8FF3",
  syntax: "#FFD700",
  property: "#30CFF2",
  num: "#F3B16A",
  str: "#77F2AC",
  oper: "#179FFF",
  bools: "#8979F2",
  struct: "#DA70D6",
  specials: "#5E9FF2",
  error: "#ED0924",
};

class AcodePlugin {
  constructor() {
    this.isCodeMirror = isCodeMirrorEngine();
    this.onThemeChange = this.onThemeChange.bind(this);

    if (!settings.value[plugin.id]) {
      settings.value[plugin.id] = {
        themeIcon: true,
        fileTabAnimation: true,
        floatingBtnAnimation: true,
        imageUrl: "",
        blurValue: "4px",
        transparency: "0.4",
        fancyAcode: true,
        fancyUniversalBlurValue: "5px",
        promptBlurValue: "",
        contextMenuBlurValue: "",
        paletteBlurValue: "",
        cursorMenuBlurValue: "",
        aceCompletionBlurValue: "",
        animatedGradientOverlay: false,
      };
      settings.update(false);
    }
  }

  async init() {
    try {
      this.$iconsStyle = <style textContent={icons}></style>;
      this.$customStyle = <style textContent={customStyle}></style>;
      document.head.append(this.$iconsStyle, this.$customStyle);

      const a = new ThemeBuilder("Dark AMOLED", "dark", "free");

      // APP BEHAVIOUR
      a.activeColor = palette.active_color; // Current tab border bottom
      a.activeTextColor = palette.active_text; // Text of active option at tab
      a.activeIconColor = palette.active_icon; // Background of current leftbar item & pushed button

      a.borderColor = palette.border; // Border between items

      a.boxShadowColor = palette.shadow; // Shadow under bars & menus
      a.buttonActiveColor = palette.button_active; //
      a.buttonBackgroundColor = palette.button_bg; // Scrollbar of editor & marked checkbox
      a.buttonTextColor = palette.button_text; // On/off circle indicator inside switch type option

      a.errorTextColor = palette.error_text; // Error description at "Problems" tab

      // MENUS & BARS
      a.primaryColor = palette.primary; // Top menu and bottom toolbar
      a.primaryTextColor = palette.primary_text;

      // APP INTERFACE
      a.secondaryColor = palette.secondary; // General interface background
      a.secondaryTextColor = palette.secondary_text;

      // LINKS
      a.linkTextColor = palette.link; // Links

      // SCROLLBAR
      a.scrollbarColor = palette.scrollbar; // Scrollbar of interface

      // POPUP WINDOWS
      a.popupBorderColor = palette.popup_border; // Popup windows border
      a.popupIconColor = palette.popup_icon; // Option icons at popup menus
      a.popupBackgroundColor = palette.popup_bg; // Background of popup windows & menus
      a.popupTextColor = palette.popup_text; // Text of buttons at popup windows & menus
      a.popupActiveColor = palette.popup_active; // Current active option at popup windows & menus
      a.dangerColor = palette.danger; // Danger buttons

      themes.add(a);

      this.registerEditorTheme();

      acode.addIcon("dark-amoled", this.baseUrl + "icon.png");
      sidebarApps.add(
        "dark-amoled",
        "dark-amoled-sidebar",
        "DarkAMOLED",
        (app) => {
          const darkContainer = tag("div", {
            className: "dark-container",
          });
          const heading = tag("h1", {
            textContent: "Add Image",
          });
          const inputBox = tag("div", {
            className: "input-box",
          });
          const inputField = tag("input", {
            type: "url",
            id: "image-url",
            placeholder: "Image url",
            value: this.plugSettings.imageUrl ? this.plugSettings.imageUrl : "",
          });
          inputField.addEventListener(
            "keypress",
            this.triggerEnterEvent.bind(this),
          );
          const folderBtn = tag("button", {
            id: "open-image-btn",
          });
          folderBtn.innerHTML = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" height="1.5em" width="1.5em"><path fill="currentColor" d="M7 40q-1.15 0-2.075-.925Q4 38.15 4 37V11q0-1.15.925-2.075Q5.85 8 7 8h12.8q.6 0 1.175.25.575.25.975.65l2.1 2.1H41q1.15 0 2.075.925Q44 12.85 44 14H10q-1.25 0-2.125.875T7 17v20l4.5-17.75q.25-1 1.1-1.625.85-.625 1.85-.625H43.1q1.45 0 2.4 1.15t.55 2.6l-4.4 16.95q-.3 1.2-1.1 1.75T38.5 40Z"/></svg>`;
          folderBtn.addEventListener(
            "click",
            this.triggerFolderBtnEvent.bind(this),
          );
          inputBox.append(inputField, folderBtn);
          const blurBox = tag("div", {
            className: "blur-box",
          });
          const blurLabel = tag("label", {
            textContent: "Blur",
            className: "blur-input-lbl",
          });
          const blurInputField = tag("input", {
            type: "text",
            id: "blur-value",
            value: this.plugSettings.blurValue
              ? this.plugSettings.blurValue
              : "4px",
            placeholder: "Blur value",
          });
          blurInputField.addEventListener(
            "keypress",
            this.changeBlurValue.bind(this),
          );
          blurBox.append(blurLabel, blurInputField);
          const transparencyBox = tag("div", {
            className: "transparency-box",
          });
          const transprancyLabel = tag("label", {
            textContent: "Transparency",
            className: "transparency-input-lbl",
          });
          const transparencyInputField = tag("input", {
            type: "range",
            id: "transparency-value",
            min: "0",
            max: "1",
            step: "0.1",
            value: this.plugSettings.transparency
              ? this.plugSettings.transparency
              : "0.4",
          });
          transparencyInputField.addEventListener(
            "input",
            this.changeTransparencyValue.bind(this),
          );
          const transparencyValueLbl = tag("span", {
            className: "transparency-value-lbl",
            textContent: this.plugSettings.transparency
              ? this.plugSettings.transparency
              : "0.4",
          });
          transparencyBox.append(
            transprancyLabel,
            transparencyInputField,
            transparencyValueLbl,
          );
          const removeImgBtn = tag("button", {
            textContent: "Remove",
            id: "remove-image-btn",
          });
          removeImgBtn.addEventListener("click", this.removeImg.bind(this));
          darkContainer.append(
            heading,
            inputBox,
            blurBox,
            transparencyBox,
            removeImgBtn,
          );
          app.append(darkContainer);
        },
      );

      const acodeXController = acode.require("acodex");
      if (acodeXController) {
        const axThemeName = "DarkAMOLED";
        const schema = {
          background: palette.secondary,
          foreground: palette.secondary_text,
          cursor: "#FFFFFF",
          cursorAccent: "#00000000",
          selectionBackground: "#FFFFFF25",
          black: "#070707",
          blue: "#179FFF",
          brightBlack: "#2A2A2A",
          brightBlue: "#175FFF",
          brightCyan: "#02F3E0",
          brightGreen: "#38FF6A",
          brightMagenta: "#FC588A",
          brightRed: "#EB1347",
          brightWhite: "#FFFFFF",
          brightYellow: "#FCD10F",
          cyan: "#02F3E0",
          green: "#38FF6A",
          magenta: "#FC588A",
          red: "#EB1347",
          white: "#FFFFFF",
          yellow: "#FCD10F",
          keyword: palette.key_word,
          string: palette.str,
          number: palette.num,
          comment: palette.muted,
          function: palette.property,
          variable: palette.text,
          type: palette.struct,
          class: palette.struct,
          constant: palette.specials,
          operator: palette.oper,
          invalid: palette.error,
        };
        acodeXController.addTheme(axThemeName, schema);
      }

      this.applyEditorTheme(settings.get("editorTheme"));
      settings.on("update:editorTheme", this.onThemeChange);

      if (!this.plugSettings.themeIcon) {
        this.$iconsStyle.remove();
      }
      if (this.plugSettings.imageUrl) {
        this.updateUiWithSettings();
      }

      if (this.plugSettings.fancyAcode) {
        this.createFancyAcode();
      }

      this.onAnimationChange();
    } catch (error) {
      console.error(error);
      acode.alert("Warning", "Please restart Acode");
    }
  }

  registerEditorTheme() {
    if (this.isCodeMirror) {
      this.registerCodeMirrorTheme();
      return;
    }
    this.registerAceTheme();
  }

  registerAceTheme() {
    if (!defineAceTheme()) {
      return;
    }
    const aceThemeList = ace.require("ace/ext/themeList").themes;
    if (!aceThemeList.some(({ theme }) => theme === legacyAceThemePath)) {
      aceThemeList.push({
        caption: editorThemeName
          .split("-")
          .map((name) => name[0].toUpperCase() + name.slice(1))
          .join(" "),
        theme: legacyAceThemePath,
        isDark: true,
      });
    }
  }
  registerCodeMirrorTheme() {
    if (
      !editorThemes ||
      typeof editorThemes.register !== "function" ||
      typeof editorThemes.createTheme !== "function" ||
      typeof editorThemes.createHighlightStyle !== "function" ||
      !editorThemes.cm ||
      !editorThemes.cm.tags
    ) {
      return;
    }

    if (
      typeof editorThemes.get === "function" &&
      editorThemes.get(codeMirrorDarkThemeId)
    ) {
      editorThemes.unregister(codeMirrorDarkThemeId);
    }

    const createTheme = editorThemes.createTheme;
    const createHighlightStyle = editorThemes.createHighlightStyle;
    const t = editorThemes.cm.tags;

    const highlightStyle = createHighlightStyle([
      // Keywords & Control flow
      {
        tag: [
          t.keyword,
          t.moduleKeyword,
          t.definitionKeyword,
          t.controlKeyword,
          t.operatorKeyword,
        ],
        color: palette.key_word,
        fontWeight: "bold",
      },

      // Strings & string-like literals
      {
        tag: [t.string, t.special(t.string), t.character, t.regexp],
        color: palette.str,
        fontWeight: "bold",
      },

      // Numbers
      {
        tag: [t.number, t.integer, t.float],
        color: palette.num,
        fontWeight: "bold",
      },

      // Booleans & constant atoms
      {
        tag: [t.bool, t.atom],
        color: palette.bools,
        fontWeight: "bold",
      },

      // Comments (line, block, doc)
      {
        tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
        color: palette.muted,
        fontStyle: "italic",
      },

      // Functions, methods, macros & labels
      {
        tag: [
          t.function(t.variableName),
          t.propertyName,
          t.macroName,
          t.labelName,
        ],
        color: palette.property,
      },

      // Types, classes, namespaces, interfaces, enums, generics
      {
        tag: [
          t.typeName,
          t.className,
          t.namespace,
          t.angleBracket,
          t.annotation,
        ],
        color: palette.struct,
      },

      // Plain variables & general definitions
      {
        tag: [t.variableName, t.definition(t.variableName)],
        color: palette.text,
      },

      // Constants (ALL_CAPS), self/this & special names
      {
        tag: [
          t.constant(t.variableName),
          t.self,
          t.standard(t.variableName),
          t.modifier,
        ],
        color: palette.specials,
      },

      // Operators of every type
      {
        tag: [
          t.operator,
          t.arithmeticOperator,
          t.logicOperator,
          t.bitwiseOperator,
          t.compareOperator,
          t.updateOperator,
          t.definitionOperator,
          t.derefOperator,
        ],
        color: palette.oper,
      },

      // Punctuation & brackets
      {
        tag: [
          t.punctuation,
          t.bracket,
          t.paren,
          t.squareBracket,
          t.brace,
          t.separator,
        ],
        color: palette.syntax,
      },

      // Markup (HTML/JSX/XML tags & attributes)
      { tag: t.tagName, color: palette.syntax },
      { tag: [t.attributeName], color: palette.property },
      { tag: t.attributeValue, color: palette.str },

      // Links, URLs & escapes
      {
        tag: [t.link, t.url],
        color: palette.link,
        textDecoration: "underline",
      },
      { tag: t.escape, color: palette.oper },

      // Markdown & doc formatting
      {
        tag: t.heading,
        color: palette.key_word,
        fontWeight: "bold",
      },
      {
        tag: t.strong,
        color: palette.text,
        fontWeight: "bold",
      },
      {
        tag: t.emphasis,
        color: palette.text,
        fontStyle: "italic",
      },
      {
        tag: [t.quote, t.monospace],
        color: palette.property,
      },

      // Meta / preprocessor / decorators
      {
        tag: [t.meta, t.processingInstruction],
        color: palette.button_active,
      },

      // Errors
      {
        tag: [t.invalid],
        color: palette.error,
        backgroundColor: "#070707",
        textDecoration: "underline wavy",
      },

      // Changes (diff/merge views)
      { tag: t.inserted, color: palette.str },
      { tag: t.deleted, color: palette.error },
      { tag: t.changed, color: palette.syntax },
    ]);

    const darkConfig = {
      name: codeMirrorDarkThemeId,
      dark: true,
      background: palette.secondary,
      foreground: palette.secondary_text,
      keyword: palette.key_word,
      string: palette.str,
      number: palette.num,
      comment: palette.muted,
      function: palette.property,
      variable: palette.text,
      type: palette.struct,
      class: palette.struct,
      constant: palette.specials,
      operator: palette.oper,
      invalid: palette.error,
    };

    editorThemes.register({
      id: codeMirrorDarkThemeId,
      caption: "Dark AMOLED",
      dark: true,
      getExtension: () =>
        createTheme({
          dark: true,
          styles: {
            "&": {
              color: palette.text,
              backgroundColor: palette.primary,
            },
            ".cm-content": { caretColor: palette.key_word },

            ".cm-cursor, .cm-dropCursor": {
              borderLeftColor: palette.syntax,
              borderLeftWidth: "2px",
            },
            ".cm-selectionBackground, .cm-content ::selection": {
              backgroundColor: "#1F1F2F",
            },
            ".cm-gutters": {
              backgroundColor: palette.primary,
              color: palette.muted,
              border: "none",
              borderRight: `1px solid ${palette.border}`,
            },
            ".cm-activeLine": {
              backgroundColor: palette.active_line,
            },
            ".cm-activeLineGutter": {
              backgroundColor: palette.active_line,
              color: palette.key_word,
            },
            ".cm-matchingBracket, .cm-nonmatchingBracket": {
              backgroundColor: "#1F1F2F",
              color: palette.syntax,
              fontWeight: "bold",
            },
            ".cm-tooltip": {
              backgroundColor: "#2F2F2F",
              border: "1px solid #3F3F54",
            },
            ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
              backgroundColor: "#FFFFFF26",
            },

            ".cm-searchMatch": {
              backgroundColor: "#142F6D",
              outline: `1px solid ${palette.property}`,
            },
            ".cm-searchMatch-selected": {
              backgroundColor: palette.popup_bg,
              color: palette.text,
            },
            ".cm-foldPlaceholder": {
              backgroundColor: palette.active_line,
              color: palette.property,
              border: `1px solid ${palette.border}`,
            },
          },
          highlightStyle,
        }),
      config: darkConfig,
    });
  }

  isTheme(value) {
    const themeValue = String(value || "")
      .trim()
      .toLowerCase();

    return (
      themeValue === editorThemeName ||
      themeValue === legacyAceThemePath ||
      themeValue === codeMirrorDarkThemeId ||
      themeValue === "dark-amoled" ||
      themeValue === "dark_amoled"
    );
  }

  applyEditorTheme(themeValue) {
    if (!editor || !this.isTheme(themeValue)) {
      return;
    }

    if (this.isCodeMirror) {
      const normalized = String(themeValue || "")
        .trim()
        .toLowerCase();

      const isDark =
        normalized === codeMirrorDarkThemeId ||
        normalized === "dark_amoled" ||
        normalized === "dark-amoled" ||
        normalized === "dark amoled";
      const targetTheme = isDark
        ? codeMirrorDarkThemeId
        : codeMirrorDarkThemeId;

      editor.setTheme(targetTheme);
      if (themeValue !== targetTheme) {
        settings.update({ editorTheme: targetTheme }, false);
      }
      return;
    }

    editor.setTheme(legacyAceThemePath);
    if (themeValue !== editorThemeName) {
      settings.update({ editorTheme: editorThemeName }, false);
    }
  }

  onThemeChange(value) {
    this.applyEditorTheme(value);
    this.updateUiWithSettings();
  }

  changeTransparencyValue() {
    const transparencyInput = document.querySelector("#transparency-value");
    const transparencyValueLbl = document.querySelector(
      ".transparency-value-lbl",
    );
    if (!transparencyInput || !transparencyValueLbl) return;

    const transparencyValue = this.parseTransparency(transparencyInput.value);
    transparencyValueLbl.textContent = String(transparencyValue);
    this.plugSettings.transparency = String(transparencyValue);
    settings.update();
    this.updateUiWithSettings();
  }

  changeBlurValue(event) {
    if (event.keyCode === 13) {
      const blurInput = document.querySelector("#blur-value");
      if (!blurInput) return;
      const blurValue = this.normalizeBlurValue(blurInput.value);
      if (!blurValue) return;
      this.plugSettings.blurValue = blurValue;
      settings.update();
      this.updateUiWithSettings();
    }
  }

  triggerEnterEvent(event) {
    if (event.keyCode === 13) {
      const urlInput = document.querySelector("#image-url");
      if (!urlInput) return;
      const urlValue = urlInput.value;
      if (!urlValue) return;
      this.plugSettings.imageUrl = urlValue;
      settings.update();
      this.updateUiWithSettings();
    }
  }
  updateUiWithSettings() {
    if (this.isCodeMirror) {
      this.updateCodeMirrorUiWithSettings();
      return;
    }
    this.updateAceUiWithSettings();
  }

  updateAceUiWithSettings() {
    const aceEditor = document.querySelector(".ace_editor");
    if (!aceEditor) return;

    const aceScroller = aceEditor.querySelector(".ace_scroller");
    const aceContent = aceEditor.querySelector(".ace_content");
    const aceGutter = aceEditor.querySelector(".ace_gutter");

    this.applyEditorBackground({
      editorElement: aceEditor,
      contentElement: aceContent,
      scrollerElement: aceScroller,
      gutterElements: [aceGutter],
    });
  }

  updateCodeMirrorUiWithSettings() {
    const rootElement = document.documentElement;
    if (!rootElement) return;

    const cmEditor = document.querySelector(".cm-editor");
    const cmContent = cmEditor && cmEditor.querySelector(".cm-content");
    const imageUrl = String(this.plugSettings.imageUrl || "").trim();

    if (!imageUrl) {
      this.clearCodeMirrorBackgroundStyles();
      return;
    }

    const useAnimatedOverlay = !!this.plugSettings.animatedGradientOverlay;
    const transparentColor = this.transparentColor(
      cmContent || cmEditor,
      this.resolveCodeMirrorThemeBackground(),
    );
    const gutterTransparentColor = this.transparentColor(
      cmContent || cmEditor,
      this.resolveCodeMirrorThemeBackground(),
      0.8,
    );
    rootElement.classList.add("cm-background");
    rootElement.style.setProperty(
      "cm-editor-img",
      useAnimatedOverlay
        ? `linear-gradient(120deg, #179FFF, #175FFF, #3C2DB3, url("${imageUrl}")`
        : `url("${imageUrl}")`,
    );
    rootElement.style.setProperty(
      "--cm-editor-size",
      useAnimatedOverlay ? "240% 240%, cover" : "cover",
    );
    rootElement.style.setProperty(
      "--cm-editor-blend",
      useAnimatedOverlay ? "soft-light, normal" : "normal",
    );
    rootElement.style.setProperty(
      "--cm-editor-animation",
      useAnimatedOverlay
        ? "gradientShift 18s ease-in-out infinite alternate"
        : "none",
    );
    rootElement.style.setProperty("--cm-editor-overlay-bg", transparentColor);
    rootElement.style.setProperty(
      "--cm-editor-blur",
      this.normalizeBlurValue(this.plugSettings.blurValue),
    );
    rootElement.style.setProperty(
      "--cm-gutter-overlay-bg",
      gutterTransparentColor,
    );
    rootElement.style.setProperty("--cm-gutter-blur", "0px");
  }

  clearCodeMirrorBackgroundStyles() {
    const rootElement = document.documentElement;
    if (!rootElement) return;

    rootElement.classList.remove("cm-background");
    rootElement.style.removeProperty("--cm-editor-image");
    rootElement.style.removeProperty("--cm-editor-size");
    rootElement.style.removeProperty("--cm-editor-blend");
    rootElement.style.removeProperty("--cm-editor-animation");
    rootElement.style.removeProperty("--cm-editor-overlay-bg");
    rootElement.style.removeProperty("--cm-editor-blur");
    rootElement.style.removeProperty("--cm-gutter-overlay-bg");
    rootElement.style.removeProperty("--cm-gutter-blur");
  }

  applyEditorBackground({
    editorElement,
    contentElement,
    scrollerElement,
    gutterElements = [],
  }) {
    if (!editorElement) return;

    const uniqueGutterElements = Array.from(
      new Set(gutterElements.filter(Boolean)),
    );

    const imageUrl = String(this.plugSettings.imageUrl || "").trim();
    if (!imageUrl) {
      this.clearEditorBackgroundStyles(
        editorElement,
        scrollerElement,
        uniqueGutterElements,
      );
      return;
    }

    const blur = this.normalizeBlurValue(this.blugSettings.blurValue);
    const transColor = this.transColor(contentElement || editorElement);
    const animatedOverlay = !!this.plugSettings.animatedGradientOverlay;

    if (animatedOverlay) {
      editorElement.style.backgroundImage = `linear-gradient(120deg, #179FFF, #175FFF, #3C2DB3, url("${imageUrl}")`;
      editorElement.style.backgroundSize = "240% 240%, cover";
      editorElement.style.backgroundBlendMode = "soft-light, normal";
      editorElement.style.animation =
        "gradientShift 18s ease-in-out infinite alternate";
    } else {
      editorElement.style.backgroundImage = `url("${imageUrl}")`;
      editorElement.style.backgroundSize = "cover";
      editorElement.style.backgroundBlendMode = "";
      editorElement.style.animation = "";
    }
    editorElement.style.backgroundPosition = "center";
    editorElement.style.backgroundRepeat = "no-repeat";

    if (scrollerElement) {
      scrollerElement.style.backgroundColor = transColor;
      scrollerElement.style.backdropFilter = `blur(${blur})`;
    }

    uniqueGutterElements.forEach((gutterElement) => {
      gutterElement.style.backgroundColor = transColor;
      gutterElement.style.backdropFilter = `blur(${blur})`;
    });
  }

  clearEditorBackgroundStyles(
    editorElement,
    scrollerElement,
    gutterElements = [],
  ) {
    editorElement.style.backgroundImage = "";
    editorElement.style.backgroundSize = "";
    editorElement.style.backgroundPosition = "";
    editorElement.style.backgroundRepeat = "";
    editorElement.style.backgroundBlendMode = "";
    editorElement.style.animation = "";

    if (scrollerElement) {
      scrollerElement.style.backgroundColor = "";
      scrollerElement.style.backdropFilter = "";
    }

    gutterElements.forEach((gutterElement) => {
      gutterElement.style.backgroundColor = "";
      gutterElement.style.backdropFilter = "";
    });
  }

  normalizeBlurValue(value) {
    const input = String(value || "").trim();
    if (!input) return "4px";

    if (/^\d+(\.\d+)?$/.test(input)) {
      return `${input}px`;
    }

    return input;
  }

  parseTransparency(value) {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return 0.4;
    return Math.min(1, Math.max(0, parsed));
  }

  transparentColor(element, fallbackColor = "", alphaScale = 1) {
    const backgroundColor =
      this.resolveBackgroundColor(element) ||
      fallbackColor ||
      this.resolveCSSVarColor("--secondary-color") ||
      "#2F2F2F";

    const rgbValues = this.parseColorToRgb(backgroundColor) || [47, 47, 47];
    const alpha = Math.min(
      1,
      Math.max(
        0,
        this.parseTransparency(this.plugSettings.transparency) * alphaScale,
      ),
    );

    return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${alpha})`;
  }

  resolveCodeMirrorThemeBackground() {
    const editorTheme = String(settings.get("editorTheme") || "")
      .trim()
      .toLowerCase();

    if (
      editorTheme === codeMirrorDarkThemeId ||
      editorTheme === editorThemeName ||
      editorTheme === legacyAceThemePath ||
      editorTheme === "dark amoled" ||
      editorTheme === "dark-amoled"
    ) {
      return "#2F2F2F";
    }

    return "";
  }

  resolveBackgroundColor(element) {
    let current = element;
    let depth = 0;

    while (current && depth < 4) {
      const comp = window.getComputedStyle(current).backgroundColor;
      const rgb = this.parseColorToRgb(comp);
      if (rgb) {
        return comp;
      }

      current = current.parentElement;
      depth += 1;
    }

    return "";
  }

  resolveCSSVarColor(variable) {
    const value = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();

    return value;
  }

  parseColorToRgb(color) {
    const value = String(color || "")
      .trim()
      .toLowerCase();
    if (!value || value === "transparent") {
      return null;
    }

    if (value.startsWith("#")) {
      const hex = value.slice(1);
      if (hex.length === 3 || hex.length === 4) {
        return [
          Number.parseInt(hex[0] + hex[0], 16),
          Number.parseInt(hex[1] + hex[1], 16),
          Number.parseInt(hex[2] + hex[2], 16),
        ];
      }

      if (hex.length === 6 || hex.length === 8) {
        return [
          Number.parseInt(hex.slice(0, 2), 16),
          Number.parseInt(hex.slice(2, 4), 16),
          Number.parseInt(hex.slice(4, 6), 16),
        ];
      }

      return null;
    }

    const rgbMatch = value.match(/^rgba?\((.+)\)$/);
    if (!rgbMatch) return null;

    const ch = rgbMatch[1]
      .replace(/\//g, " ")
      .split(/[\s,]+/)
      .filter(Boolean);

    if (ch.length < 3) return null;

    return [
      this.toRgbByte(ch[0]),
      this.toRgbByte(ch[1]),
      this.toRgbByte(ch[2]),
    ];
  }

  toRgbByte(ch) {
    const value = String(ch || "").trim();
    if (value.endsWith("%")) {
      const percent = Number.parseFloat(value);
      if (Number.isNaN(percent)) return 0;
      return Math.max(0, Math.min(255, Math.round((percent / 100) * 255)));
    }
  }
  onAnimationChange() {
    const fileList = document.querySelector(".open-file-list");
    if (fileList) {
      if (this.plugSettings.fileTabAnimation) {
        fileList.style.setProperty(
          "--open-filelist-line-animation",
          "changeColor 6s ease-in-out infinite alternate",
        );
        fileList.style.setProperty(
          "--open-filelist-glow-animation",
          "glowingEffect 2.2s ease-in-out infinite alternate",
        );
      } else {
        fileList.style.setProperty("--open-filelist-line-animation", "");
        fileList.style.setProperty("--open-filelist-glow-animation", "");
      }
    }

    const floatingIcon = document.getElementById("quicktools-toggler");
    if (floatingIcon) {
      if (this.plugSettings.floatingBtnAnimation) {
        floatingIcon.classList.remove("no_animation");
        floatingIcon.style.setProperty(
          "--floating-btn-animation",
          "steam 20s linear infinite",
        );
      } else {
        floatingIcon.style.setProperty("--floating-btn-animation", "");
        floatingIcon.classList.add("no_animation");
      }
    }
  }

  createFancyAcode() {
    const existingStyle = document.getElementById("fancyAcodeStyles");
    if (existingStyle) {
      existingStyle.remove();
    }

    const fancyStyling = document.createElement("style");
    fancyStyling.id = "fancyAcodeStyles";
    fancyStyling.textContent = `
				.prompt{
						background-color: transparent;
						backdrop-filter: blur(${this.plugSettings.promptBlurValue ? this.plugSettings.promptBlurValue : this.plugSettings.fancyUniversalBlurValue});
						border-color: var(--border-color);
				}
				.context-menu{
						background-color: transparent;
						backdrop-filter: blur(${this.plugSettings.contextMenuBlurValue ? this.plugSettings.contextMenuBlurValue : this.plugSettings.fancyUniversalBlurValue});
						border-color: var(--border-color);
				}
				#palette{
						background-color: transparent;
						backdrop-filter: blur(${this.plugSettings.paletteBlurValue ? this.plugSettings.paletteBlurValue : this.plugSettings.fancyUniversalBlurValue});
						border-color: var(--border-color);
				}
				#hints{
						background-color: transparent;
						backdrop-filter: blur(${this.plugSettings.paletteBlurValue ? this.plugSettings.paletteBlurValue : this.plugSettings.fancyUniversalBlurValue});
						border-color: var(--border-color);
				}
				.cursor-menu{
						background-color: transparent;
						backdrop-filter: blur(${this.plugSettings.cursorMenuBlurValue ? this.plugSettings.cursorMenuBlurValue : this.plugSettings.fancyUniversalBlurValue});
						border-color: var(--border-color);
				}
				.ace_dark.ace_editor.ace_autocomplete{
						background-color: transparent;
						backdrop-filter: blur(${this.plugSettings.aceCompletionBlurValue ? this.plugSettings.aceCompletionBlurValue : this.plugSettings.fancyUniversalBlurValue});
						border-color: var(--border-color);
				}
				`;
    document.head.append(fancyStyling);
  }

  get settingsObj() {
    return {
      list: [
        {
          key: "themeIcon",
          text: "Enable Theme Icon",
          checkbox: !!this.plugSettings.themeIcon,
          info: `If set to "true" means checked, then it will add a some icon to acode and that will match Sweet Plasma schema. If set to "false" means unchecked then theme icon will not be applied`,
        },
        {
          key: "fileTabAnimation",
          text: "Enable File Tab animation",
          checkbox: !!this.plugSettings.fileTabAnimation,
          info: `If set to "true" means checked, then it will add a beautiful glowing effect to it. If set to "false" means unchecked then animation will not be applied`,
        },
        {
          key: "floatingBtnAnimation",
          text: "Enable Quicktools toggler anination",
          checkbox: !!this.plugSettings.floatingBtnAnimation,
          info: `If set to "true" means checked, then it will add a beautiful glowing effect to it. If set to "false" means unchecked then animation will not be applied`,
        },
        {
          key: "fancyAcode",
          text: "Enable Fancy Acode",
          checkbox: !!this.plugSettings.fancyAcode,
          info: `If set to "true" means checked, then acode components will be transparent and with gauzy blurry effect. If set to "false" means unchecked then it will be normal default design`,
        },
        {
          key: "fancyUniversalBlurValue",
          text: "Blur Value for fancy design",
          value: this.plugSettings.fancyUniversalBlurValue,
          prompt: "Blur Value for fancy design",
          promptType: "text",
        },
        {
          key: "animatedGradientOverlay",
          text: "Enable Gradient Overlay",
          checkbox: !!this.plugSettings.animatedGradientOverlay,
          info: "Adds a subtle animated gradient layer over editor background image.",
        },
      ],
      cb: (key, value) => {
        this.plugSettings[key] = value;
        settings.update();

        if (this.plugSettings.themeIcon) {
          document.head.append(this.$iconsStyle);
        } else {
          this.$iconsStyle.remove();
        }

        if (this.plugSettings.fancyAcode) {
          this.createFancyAcode();
        } else {
          const existingStyle = document.getElementById("fancyAcodeStyles");
          if (existingStyle) {
            existingStyle.remove();
          }
        }

        this.onAnimationChange();
        this.updateUiWithSettings();

        acode.alert("Warning", "Please restart Acode");
      },
    };
  }

  get plugSettings() {
    return settings.value[plugin.id];
  }

  async destroy() {
    sidebarApps.remove("dark-sidebar");
    settings.off("update:editorTheme", this.onThemeChange);
    this.clearCodeMirrorBackgroundStyles();

    if (
      this.isCodeMirror &&
      editorThemes &&
      typeof editorThemes.unregister === "function"
    ) {
      editorThemes.unregister(codeMirrorDarkThemeId);
    }

    if (this.$iconsStyle) {
      this.$iconsStyle.remove();
    }

    if (this.$customStyle) {
      this.$customStyle.remove();
    }

    const fancyStyles = document.getElementById("fancyAcodeStyles");
    if (fancyStyles) {
      fancyStyles.remove();
    }

    delete settings.value[plugin.id];
    settings.update(true);
  }
}

if (window.acode) {
  const acodePlugin = new AcodePlugin();
  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      acodePlugin.baseUrl = baseUrl;
      await acodePlugin.init($page, cacheFile, cacheFileUrl);
    },
    acodePlugin.settingsObj,
  );

  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
