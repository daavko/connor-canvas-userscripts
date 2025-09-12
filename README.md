# Connor canvas userscripts by daavko

## Installation

1. Get a userscript extension for your browser. Popular options include (this is not an exhaustive list):
    - [Tampermonkey](https://www.tampermonkey.net/)
    - [Violentmonkey](https://violentmonkey.github.io/)
    - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
2. Install the script by visiting [pxls.daavko.moe](https://pxls.daavko.moe/) and clicking the install link. This will automatically install the script in your userscript extension.

Note: The script should work on any userscript extension, but it's primarily tested on Tampermonkey. If you
encounter any issues, find me on Discord.

## License

This repository is licensed under the GPLv3 license or any later version. You can find the full license
text in the [LICENSE](LICENSE.md) file.

## How to build the script locally

Run the `npm run build` script. There's also the following options you can include:

- `--no-minify` - Don't minify the output script (useful for debugging)
- `--sourcemap` - Generate a source map for the output script (useful for debugging)
- `--watch` - Watch for changes in the script and rebuild automatically
