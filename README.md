# Mupanda

Personal Syntax Theme based on [Panda-Syntax](https://www.github.com/tinkertrain/panda-syntax-vscode) for Visual Studio Code. The extension isn't on the marketplace, instead build it yourself or fetch a build artifact from [the actions tab](https://github.com/Veykril/MuPanda/actions).

## How to build

Install [Deno](https://deno.land/) and checkout the repo. Then run `deno run --allow-read --allow-write build.ts` followed by `vsce package`.

## General Color Info

- Types and number literals are colored orange
- Strings and doc-comments are green
- Format specifiers in strings(interpolation arguments etc.) are light orange.
- Comments are gray
- Keywords are pink
- Interfaces are purple
- Modules are white
- Identifiers in general are white
- Globals as in Constants/Statics are **bold**
- Functions are blue

The light color variations are used for these items if they are special variations in a sense. For example:
- Types are orange colored, but primitive types are light orange.
- Strings are green, but string escapes are light green.
- Keywords are pink, but some with special meanings(certain constant values etc.) like `this`, `self`, `true`, `false` or `null` are light pink.
- Functions are blue, but function-like things like rust's macros are light blue.
