# Pxls userscripts by daavko

## Installation

1. Get a userscript extension for your browser. Popular options include (this is not an exhaustive list):
    - [Tampermonkey](https://www.tampermonkey.net/)
    - [Violentmonkey](https://violentmonkey.github.io/)
    - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
2. Install the script you want by visiting [pxls.daavko.moe](https://pxls.daavko.moe/) and clicking one of the links in
   the "Userscripts" section. This will automatically install the script in your userscript extension.

Note: The scripts should work on any userscript extension, but they are primarily tested on Tampermonkey. If you
encounter any issues, please create an issue on this GitHub repository or find me on Discord.

## List of scripts

### Template color autoselector

This script automatically selects the color of the pixel you are currently hovering over, based on the loaded template.
There's various options in the settings menu to customize the behavior of the script.

### Milestone watcher

This script checks the amount of pixels you have placed (on current canvas and overall), and notifies you when you reach
a milestone. You can customize the milestones in the settings menu.

### Grief tracker

This script highlights griefed pixels with a configurable highlight.

**Warning: This script is not recommended for use in Google Chrome with very large templates. For whatever reason, when
the grief view is active, Chrome completely recalculates the entire board view when a pixel is changed, including
decoding the template image from scratch even though it hasn't changed. This causes the whole tab to freeze for that
time (I've personally observed freezes of around 250ms with a ~7500x8500 template image on a very strong desktop).**
Smaller templates are fine, since they don't take as long to decode.

This should be pretty obvious, but... **this script makes use of flashing animations to highlight things, don't use it
if you have epilepsy or something similar**

### Template Info

Shows basic template info in the info bubble.

## License

All scripts in this repository are licensed under the GPLv3 license or any later version. You can find the full license
text in the [LICENSE](LICENSE.md) file.

## How to build a script locally

Run the `build.js` script with Node.js to build. The first argument is the path to the script you want to build. There's
also the following options you can include:

- `--no-minify` - Don't minify the output script (useful for debugging)
- `--sourcemap` - Generate a source map for the output script (useful for debugging)
- `--watch` - Watch for changes in the script and rebuild automatically
