// TODO W-7282286 - we'll need to revisit this once our nimbus network plugin is
// up and running.  Until then we are just going to use the aura network adapter
// while in webview.  We'll want to refactor src/lds/main to break out the LDS
// instance creation from the factory registration so we can share the latter.
export * from '../main';
