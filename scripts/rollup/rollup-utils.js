import { execSync } from 'child_process';

/**
 * @export
 * @param {boolean} includeCompatDisable Determines if proxy-compat-disable hint is printed in header
 * @returns {string}
 */
export function buildBanner(includeCompatDisable) {
    const banner = [
        '/*  *******************************************************************************************',
        ' *  ATTENTION!',
        ' *  THIS IS A GENERATED FILE FROM https://github.com/salesforce/lds-lightning-platform',
        ' *  If you would like to contribute to LDS, please follow the steps outlined in the git repo.',
        ' *  Any changes made to this file in p4 will be automatically overwritten.',
        ' *  *******************************************************************************************',
        ' */',
    ];

    if (includeCompatDisable === false) {
        return banner.join('\n');
    }

    const PROXY_COMPAT_DISABLE = '/* proxy-compat-disable */';
    return banner.concat([PROXY_COMPAT_DISABLE]).join('\n');
}

/**
 * @export
 * @param {string} packageVersion
 * @returns {string}
 */
export function buildFooter(packageVersion) {
    const hash = readGitHash();
    return `// version: ${packageVersion}-${hash}`;
}

/**
 * Determines current GIT commit's hash.  Returns empty string if hash cannot be
 * determined.
 *
 * @export
 * @returns {string}
 */
export function readGitHash() {
    let hash;
    try {
        hash = execSync('git rev-parse --short HEAD')
            .toString()
            .trim();
    } catch (e) {
        //ignore
        hash = '';
    }

    return hash;
}
