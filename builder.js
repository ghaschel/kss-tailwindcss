"use strict";

const fs = require("fs");
const path = require("path");

const KssBuilderBaseHandlebars = require("kss/builder/base/handlebars");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const patchHighlightCompatibility = () => {
  const highlight = require("highlight.js");

  if (highlight.__stylusTrueKssPatch) {
    return;
  }

  const originalHighlight = highlight.highlight.bind(highlight);

  highlight.highlight = (codeOrLanguageName, optionsOrCode, ignoreIllegals) => {
    if (typeof optionsOrCode === "string") {
      return originalHighlight(optionsOrCode, {
        language: codeOrLanguageName,
        ignoreIllegals: ignoreIllegals !== false,
      });
    }

    return originalHighlight(codeOrLanguageName, optionsOrCode);
  };
  highlight.__stylusTrueKssPatch = true;
};

const resolveIconPath = (name) => {
  const candidates = [];

  try {
    const lucideRoot = path.dirname(require.resolve("lucide-static/package.json"));
    candidates.push(
      path.join(lucideRoot, "icons", `${name}.svg`),
      path.join(lucideRoot, `${name}.svg`)
    );
  } catch (_error) {
    // Icons are optional while installing dependencies; generation still works.
  }

  return candidates.find((candidate) => fs.existsSync(candidate));
};

class KssBuilderTailwind extends KssBuilderBaseHandlebars {
  constructor() {
    super();
    patchHighlightCompatibility();

    this.addOptionDefinitions({
      title: {
        group: "Style guide:",
        string: true,
        multiple: false,
        describe: "Title of the style guide",
        default: "KSS Style Guide",
      },
    });
  }

  prepare(styleGuide) {
    return super.prepare(styleGuide).then((preparedStyleGuide) => {
      const Handlebars = this.Handlebars;

      if (!Handlebars.helpers.eq) {
        Handlebars.registerHelper("eq", (left, right) => left === right);
      }

      if (!Handlebars.helpers.or) {
        Handlebars.registerHelper("or", function () {
          return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        });
      }

      if (!Handlebars.helpers.not) {
        Handlebars.registerHelper("not", (value) => !value);
      }

      if (!Handlebars.helpers.includes) {
        Handlebars.registerHelper("includes", (value, needle) =>
          String(value || "").includes(String(needle))
        );
      }

      if (!Handlebars.helpers.plain) {
        Handlebars.registerHelper("plain", stripHtml);
      }

      if (!Handlebars.helpers.json) {
        Handlebars.registerHelper(
          "json",
          (value) =>
            new Handlebars.SafeString(
              JSON.stringify(value || null).replace(/</g, "\\u003c")
            )
        );
      }

      if (!Handlebars.helpers.icon) {
        Handlebars.registerHelper("icon", function (name, className) {
          const iconPath = resolveIconPath(name);

          if (!iconPath) {
            return new Handlebars.SafeString(
              `<span aria-hidden="true" class="${escapeHtml(
                className || ""
              )}"></span>`
            );
          }

          const svg = fs
            .readFileSync(iconPath, "utf8")
            .replace(/\sclass="[^"]*"/, "")
            .replace(
              "<svg",
              `<svg aria-hidden="true" focusable="false" class="${escapeHtml(
                className || ""
              )}"`
            );

          return new Handlebars.SafeString(svg);
        });
      }

      const highlight = require("highlight.js");

      Handlebars.registerHelper("hljs", function (code, language) {
        const source = String(code || "");
        const lang = String(language || "html");

        try {
          return new Handlebars.SafeString(
            highlight.highlight(source, {
              language: lang,
              ignoreIllegals: true,
            }).value
          );
        } catch (_error) {
          return new Handlebars.SafeString(escapeHtml(source));
        }
      });

      return preparedStyleGuide;
    });
  }

  prepareContext(context) {
    super.prepareContext(context);

    const delimiter = this.styleGuide.referenceDelimiter();
    const rootSections = this.styleGuide.sections("x");
    const rootUriByReference = {};

    rootSections.forEach((section) => {
      rootUriByReference[section.reference()] = section.referenceURI();
    });

    const sections = this.styleGuide.sections().map((section) => {
      const json = section.toJSON();
      const rootReference = json.reference.split(delimiter)[0];
      const rootUri = rootUriByReference[rootReference] || json.referenceURI;

      return {
        ...json,
        summary: stripHtml(json.description),
        sectionUrl: `section-${rootUri}.html#kssref-${json.referenceURI}`,
        itemUrl: `item-${json.referenceURI}.html`,
      };
    });

    context.allSections = sections;
    context.searchIndex = JSON.stringify(
      sections.map((section) => ({
        title: stripHtml(section.header),
        reference: section.reference,
        referenceNumber: section.referenceNumber,
        description: section.summary,
        url: section.sectionUrl,
        itemUrl: section.itemUrl,
        deprecated: section.deprecated,
        experimental: section.experimental,
        private: String(section.description || "").includes("[private"),
      }))
    ).replace(/</g, "\\u003c");
    context.styleGuideStats = {
      sections: sections.length,
      roots: rootSections.length,
      examples: sections.filter((section) => section.markup).length,
      parameters: sections.reduce(
        (total, section) => total + section.parameters.length,
        0
      ),
    };
  }
}

module.exports = KssBuilderTailwind;
