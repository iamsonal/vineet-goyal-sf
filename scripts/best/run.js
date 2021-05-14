const { execSync } = require('child_process');
const { resolve } = require('path');

const REPO_ROOT = resolve(__dirname, '../../');
// FILES that we need JS versions for best
const FILES = ['packages/lds-adapters-graphql/src/util/ast-to-string.ts'].map(file =>
    resolve(REPO_ROOT, file)
);

const buildOrClean = process.argv[2];

if (buildOrClean === 'build') {
    execSync(`tsc ${FILES.join(' ')} --target ESNext --moduleResolution node`, (err, stdout) => {
        if (err) {
            // eslint-disable-next-line no-console
            console.error(`Couldn't transpile one of the files: ${err}`);
            return;
        }
        // eslint-disable-next-line no-console
        console.log(stdout);
    });
} else if (buildOrClean === 'clean') {
    // remove all JS transpiled files
    FILES.forEach(tsFile => {
        const jsFile = tsFile.replace('.ts', '.js');
        execSync(`rm ${jsFile}`);
    });
}
