import * as yaml from "https://deno.land/std/encoding/yaml.ts";

type MappedObject = { [key: string]: string };

interface Base {
  tokenColors: TokenColor[];
  semanticTokenColors: { [key: string]: string };
}

interface Workbench {
  colors: MappedObject;
}

interface TokenColor {
  scope: string;
  settings: { foreground?: string; fontStyle?: string };
}

interface LangExt {
  tokenColors: TokenColor[];
  semanticTokenColors: { [key: string]: string };
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
base.semanticTokenColors = {};

// VSCode workbench theme definitions
const workbench = parse_yaml<Workbench>("src/workbench.yaml");

// Merge workbench styles
const res = { ...base, ...workbench };

/// append lang colors
for (const dirEntry of Deno.readDirSync("./src/languages")) {
  const lang = parse_yaml_opt<LangExt>(
    "./src/languages/" + dirEntry.name,
  );
  if (lang != undefined) {
    res.tokenColors = res.tokenColors.concat(lang.tokenColors);
    res.semanticTokenColors = {
      ...res.semanticTokenColors,
      ...lang.semanticTokenColors,
    };
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
      `Unknown color key ${color_key}`,
    );
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
        `Unknown color key ${color_key}`,
      );
    }
  }
}
/// resolve semantic tokencolors
for (const property in res.semanticTokenColors) {
  const color_key = res.semanticTokenColors[property];

  const color = theme_colors[color_key];
  if (color != undefined) {
    res.semanticTokenColors[property] = color;
  } else {
    console.warn(
      `Unknown color key ${color_key}`,
    );
  }
}

Deno.writeTextFileSync("./build/MuPanda.json", JSON.stringify(res));
