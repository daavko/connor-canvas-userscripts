import * as esbuild from 'esbuild';
import { readFile, rm } from 'fs/promises';

// first argument is the filename (e.g., 'src/scripts/my-script.user.ts')
const filename = process.argv[2];

if (!filename) {
    console.error('Usage: node build.js <filename>');
    process.exit(1);
}

// gather the rest of the arguments
const args = process.argv.slice(3);
const options = {
    minify: true,
    sourcemap: false,
    watch: false,
};

for (const arg of args) {
    if (arg === '--no-minify') {
        options.minify = false;
    } else if (arg === '--sourcemap') {
        options.sourcemap = true;
    } else if (arg === '--watch') {
        options.watch = true;
    } else {
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
}

// banner file is derived from the filename (e.g., 'src/scripts/my-script.user.ts' => 'src/scripts/my-script.banner.txt')
const bannerFilename = filename.replace(/\.user\.ts$/, '.banner.txt');

// read the banner file (Node.js)
let banner;
try {
    banner = await readFile(bannerFilename, 'utf-8');
} catch (e) {
    console.error(`Error reading banner file: ${bannerFilename}`);
    console.error(e);
    process.exit(1);
}

// clear the dist directory
try {
    await rm('dist', { recursive: true, force: true });
} catch (e) {
    console.error(`Error clearing dist directory: ${e}`);
    process.exit(1);
}

const esbuildOptions = {
    entryPoints: [filename],
    bundle: true,
    minify: options.minify,
    outdir: 'dist',
    banner: {
        js: banner,
    },
    sourcemap: options.sourcemap ? 'inline' : false,
    loader: {
        '.vert': 'text',
        '.frag': 'text',
    },
};

const cssMinifyPlugin = {
    name: 'css-minify',
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const css = await esbuild.build({
                entryPoints: [args.path],
                loader: { '.css': 'css' },
                bundle: true,
                minify: options.minify,
                write: false,
            });
            return {
                contents: css.outputFiles[0].text.trim(),
                loader: 'text',
            };
        });
    },
};
const workerPlugin = {
    name: 'worker-plugin',
    setup(build) {
        build.onLoad({ filter: /\.worker\.ts$/ }, async (args) => {
            const result = await esbuild.build({
                entryPoints: [args.path],
                loader: {
                    ...esbuildOptions.loader,
                    '.ts': 'ts',
                },
                bundle: true,
                minify: options.minify,
                write: false,
                format: 'iife',
            });
            return {
                contents: result.outputFiles[0].text.trim(),
                loader: 'text',
            };
        });
    },
};
const pxlsModulePlugin = {
    name: 'pxls-module-plugin',
    setup(build) {
        build.onLoad({ filter: /\.pxls-module\.ts$/ }, async (args) => {
            const result = await esbuild.build({
                entryPoints: [args.path],
                loader: {
                    ...esbuildOptions.loader,
                    '.ts': 'ts',
                },
                bundle: true,
                minify: options.minify,
                write: false,
                format: 'iife',
                plugins: [cssMinifyPlugin, workerPlugin],
            });
            return {
                contents: result.outputFiles[0].text.trim(),
                loader: 'text',
            };
        });
    },
};
const watchPlugin = {
    name: 'watch-plugin',
    setup(build) {
        build.onStart(() => {
            console.log('Building...');
        });
        build.onEnd(() => {
            console.log('Build complete.');
        });
    },
};

// build the script using esbuild
if (options.watch) {
    console.log(`Watching ${filename}...`);
    const context = await esbuild.context({
        ...esbuildOptions,
        plugins: [cssMinifyPlugin, workerPlugin, pxlsModulePlugin, watchPlugin],
    });
    await context.rebuild();
    console.log('Watching for changes...');
    await context.watch();
} else {
    console.log(`Building ${filename}...`);
    await esbuild.build({
        ...esbuildOptions,
        plugins: [cssMinifyPlugin, workerPlugin, pxlsModulePlugin],
    });
    console.log(`Build complete. Output in 'dist' directory.`);
}
