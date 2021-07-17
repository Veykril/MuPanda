import * as yaml from "https://deno.land/std@0.97.0/encoding/yaml.ts";

type MappedObject = { [key: string]: string };

const BLACK = "#000000";
const STYLE_NONE = "";

interface Base {
  tokenColors: TokenColor[];
  semanticTokenColors: SemanticTokenColors;
}

interface Workbench {
  colors: MappedObject;
}

interface PluginExt {
  colors: MappedObject;
}

interface TokenColor {
  scope: string;
  settings: ColorSettings;
}

interface ColorSettings {
  foreground?: string;
  fontStyle?: string;
}

interface LangExt {
  langKey?: string;
  semLangKey?: string;
  tokenColors?: TokenColor[];
  semanticTokenColors?: SemanticTokenColors;
}

interface SemanticTokenColors {
  [key: string]: (string | ColorSettings);
}

function parse_yaml_opt<T extends object>(
  path: string,
): T | null {
  try {
    return parse_yaml<T>(path);
  } catch (e) {
    console.info(`Couldn't parse ${path}: ${e}`);
    return null;
  }
}

function parse_yaml<T extends object>(path: string): T {
  return yaml.parse(Deno.readTextFileSync(path)) as T;
}

function warn_color(color_key: string) {
  console.warn(`Unknown color key ${color_key}, placing black(${BLACK})`);
}

function warn_style(style_key: string) {
  console.warn(`Unknown style key ${style_key}, placing none(${STYLE_NONE})`);
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const theme_colors = parse_yaml<MappedObject>(
  "src/colors.yaml",
);

/// Resolve color usage in the colors.yaml file(should be split into two files)
for (let property in theme_colors) {
  const color_key = theme_colors[property];

  const color = theme_colors[color_key];
  if (color) {
    theme_colors[property] = color;
  }
}

// Base includes general language syntax tokens
const base = parse_yaml<Base>("src/base.yaml");

// VSCode workbench theme definitions
const workbench = parse_yaml<Workbench>("src/workbench.yaml");

// Merge workbench styles
const res = { ...base, ...workbench };

/// append lang colors
for (const dirEntry of Deno.readDirSync("./src/languages")) {
  const lang_name = dirEntry.name;
  const lang = parse_yaml_opt<LangExt>(
    `./src/languages/${lang_name}`,
  );
  if (!lang) {
    console.info(`Skipping invalid language ${lang_name}`);
    continue;
  }
  console.info(`Adding language ${lang_name}`);
  if (lang.langKey) {
    // append .lang_key to all textmate scopes
    const tm_suffix = "." + lang.langKey;
    if (lang.tokenColors) {
      lang.tokenColors.forEach((token_color) => {
        token_color.scope = token_color.scope.split(",").map((scope) =>
          scope + tm_suffix
        ).join(",");
      });
    }
    const sem_suffix = ":" + (lang.semLangKey || lang.langKey);
    // append .lang_key to all semantic token colors if they exists
    if (lang.semanticTokenColors) {
      let remapped: SemanticTokenColors = {};
      for (const prop in lang.semanticTokenColors) {
        remapped[prop + sem_suffix] = lang.semanticTokenColors[prop];
      }
      lang.semanticTokenColors = remapped;
    }
  }
  if (lang.tokenColors) {
    res.tokenColors = res.tokenColors.concat(lang.tokenColors);
  }
  if (lang.semanticTokenColors) {
    for (const prop in lang.semanticTokenColors) {
      if (prop in res.semanticTokenColors) {
        console.warn(
          `Overwriting a semanticTokenColor that is already defined: ${prop}`,
        );
      }
    }
    res.semanticTokenColors = {
      ...res.semanticTokenColors,
      ...lang.semanticTokenColors,
    };
  }
}

/// append plugin colors
for (const dirEntry of Deno.readDirSync("./src/plugins")) {
  const plugin_name = dirEntry.name;
  const plugin = parse_yaml_opt<PluginExt>(
    `./src/plugins/${plugin_name}`,
  );
  if (!plugin || !plugin.colors) {
    console.info(`Skipping invalid plugin ${plugin_name}`);
    continue;
  }
  console.info(`Adding plugin ${plugin_name}`);
  res.colors = {
    ...res.colors,
    ...plugin.colors,
  };
}

/// resolve colors
for (const property in res.colors) {
  const color_key = res.colors[property];

  const color = theme_colors[color_key];
  if (color) {
    res.colors[property] = color;
  } else {
    warn_color(color_key);
    res.colors[property] = BLACK;
  }
}

/// resolve tokencolors
for (const token_color of res.tokenColors) {
  const settings = token_color.settings;
  const color_key = settings.foreground;
  const style_key = settings.fontStyle;

  if (color_key) {
    const color = theme_colors[color_key];
    if (color) {
      settings.foreground = color;
    } else {
      warn_color(color_key);
      settings.foreground = BLACK;
    }
  }
  if (style_key) {
    const style = style_key.split(" ").map((style_key) =>
      theme_colors[style_key]
    );
    if (style.every((style) => style != null)) {
      settings.fontStyle = style.join(" ");
    } else {
      warn_style(style_key);
      settings.fontStyle = STYLE_NONE;
    }
  }
}

/// resolve semantic tokencolors
for (const property in res.semanticTokenColors) {
  const settings = res.semanticTokenColors[property];
  if (typeof (settings) === "string") {
    // Color is just a foreground color
    const color = theme_colors[settings];
    if (color) {
      res.semanticTokenColors[property] = color;
    } else {
      warn_color(settings);
      res.semanticTokenColors[property] = BLACK;
    }
  } else {
    const color_key = settings.foreground;
    if (color_key) {
      const color = theme_colors[color_key];
      if (color) {
        settings.foreground = color;
      } else {
        warn_color(color_key);
        settings.foreground = BLACK;
      }
    }
    const style_key = settings.fontStyle;
    if (style_key) {
      const style = style_key.split(" ").map((style_key) =>
        theme_colors[style_key]
      );
      if (style.every((style) => style != null)) {
        settings.fontStyle = style.join(" ");
      } else {
        warn_style(style_key);
        settings.fontStyle = STYLE_NONE;
      }
    }
  }
}

Deno.writeTextFileSync("./build/MuPanda.json", JSON.stringify(res));
