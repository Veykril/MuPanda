# Mupanda

Personal Syntax Theme based on [Panda-Syntax](https://www.github.com/tinkertrain/panda-syntax-vscode) for Visual Studio Code.
The extension isn't on the marketplace, instead build it yourself or fetch a build artifact from [the actions tab](https://github.com/Veykril/MuPanda/actions).

This extension mainly makes use of semantic highlighting, so if used without it the theme will look broken for most things.

It also is mainly used with Rust in mind only so other languages might look odd in some regards if supported at all, happy to accept contributions.

<img alt="" src="https://user-images.githubusercontent.com/3757771/126920084-f5e9ff22-1148-4c66-a718-8b83c54cf1d1.png" width="60%">

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
