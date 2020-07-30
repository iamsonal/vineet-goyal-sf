export * from './common';

// environments that do not support LWC (headless/DOM-less environments) cannot
// call refresh
export function refresh() {
    throw new Error('Cannot call refresh in a no-LWC environment');
}
