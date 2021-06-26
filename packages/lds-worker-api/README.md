# lds-worker-api

- Bundles together the following:
  - LDS uiapi adapters
  - lds-runtime-mobile
  - invokeAdapter/subscribeAdapter functions that map adapter names to adapter invocations
    - eg: calling invokeAdapter("getRecord") invokes the getRecord adapter function
    - this function will be put on the global object (ie: globalThis) so standalone environments can call it
- outputs a rolled-up module that gets published on the nexus npm registry as @mobileplatform/lds-worker-api
