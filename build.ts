import * as yaml from "https://deno.land/std/encoding/yaml.ts";

type MappedObject = { [key: string]: string };

const BLACK = "#000000";

interface Base {
  tokenColors: TokenColor[];
  semanticTokenColors: SemanticTokenColors;
}

interface Workbench {
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
  tokenColors: TokenColor[];
  semanticTokenColors?: SemanticTokenColors;
}

interface SemanticTokenColors {
  [key: string]: (string | ColorSettings);
}

function parse_yaml_opt<T extends object>(
  path: string,
): T | undefined {
  return yaml.parse(Deno.readTextFileSync(path)) as T;
}

function parse_yaml<T extends object>(path: string): T {
  const val = parse_yaml_opt<T>(path);
  if (val != undefined) {
    return val;
  } else {
    throw `Couldn't parse ${path}`;
  }
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
  if (color != undefined) {
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
  if (lang != undefined) {
    if (lang.langKey != undefined) {
      const lang_key = "." + lang.langKey;
      lang.tokenColors.forEach((token_color) => {
        const scopes = token_color.scope.split(",").map((scope) =>
          scope + lang_key
        );
        token_color.scope = scopes.join(",");
      });
    }
    console.info(`Adding language ${lang_name}`);
    if (!!lang.tokenColors) {
      res.tokenColors = res.tokenColors.concat(lang.tokenColors);
    }
    if (!!lang.semanticTokenColors) {
      res.semanticTokenColors = {
        ...res.semanticTokenColors,
        ...lang.semanticTokenColors,
      };
    }
  }
}
/// resolve colors
for (const property in res.colors) {
  const color_key = res.colors[property];

  const color = theme_colors[color_key];
  if (color != undefined) {
    res.colors[property] = color;
  } else {
    console.warn(
      `Unknown color key ${color_key}, placing black(${BLACK})`,
    );
    res.colors[property] = BLACK;
  }
}
/// resolve tokencolors
for (const token_color of res.tokenColors) {
  const settings = token_color.settings;
  const color_key = settings.foreground;

  if (color_key != undefined) {
    const color = theme_colors[color_key];
    if (color != undefined) {
      settings.foreground = color;
    } else {
      console.warn(
        `Unknown color key ${color_key}, placing black(${BLACK})`,
      );
      settings.foreground = BLACK;
    }
  }
}
/// resolve semantic tokencolors
for (const property in res.semanticTokenColors) {
  const color_key = res.semanticTokenColors[property];
  if (typeof (color_key) === "string") {
    const color = theme_colors[color_key];
    if (color != undefined) {
      res.semanticTokenColors[property] = color;
    } else {
      console.warn(
        `Unknown color key ${color_key}, placing black(${BLACK})`,
      );
      res.semanticTokenColors[property] = BLACK;
    }
  } else if (!!color_key.foreground) {
    const color = theme_colors[color_key.foreground];
    if (color != undefined) {
      color_key.foreground = color;
    } else {
      console.warn(
        `Unknown color key ${color_key}, placing black(${BLACK})`,
      );
      color_key.foreground = BLACK;
    }
  }
}

Deno.writeTextFileSync("./build/MuPanda.json", JSON.stringify(res));
