const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const PACAKGES_ROOT = path.resolve(REPO_ROOT, 'packages');

const wires = [];

// adapters families that don't conform to typical package structure
const blocklist = ['lds-adapters-platform-flow'];

fs.readdirSync(PACAKGES_ROOT).forEach((package) => {
    if (
        package.startsWith('lds-adapters') === false ||
        blocklist.findIndex((x) => x === package) > -1
    ) {
        return;
    }
    const wireDir = path.resolve(PACAKGES_ROOT, package, 'src/wire');
    fs.readdirSync(wireDir).forEach((adapter) => {
        const adapterDir = path.resolve(wireDir, adapter);
        if (fs.lstatSync(adapterDir).isDirectory()) {
            const overrideFolder = path.resolve(package, 'overrides/adapters');
            const ramlArtifactFolder = path.resolve(package, 'raml-artifacts/adapters');
            const index = `${adapterDir}/index.ts`;
            const offlineTest = `${adapterDir}/__tests__/offline.spec.ts`;
            const overrides = `${overrideFolder}/${adapter}.ts`;
            const ramlArtifact = `${ramlArtifactFolder}/${adapter}.ts`;
            const isCustom = fs.existsSync(index);
            const hasOfflineTests = fs.existsSync(offlineTest);
            const hasOverrides = fs.existsSync(overrides);
            const hasRamlArtifact = fs.existsSync(ramlArtifact);
            const needsOfflineTest =
                (isCustom || hasOverrides || hasRamlArtifact) && hasOfflineTests === false;
            wires.push({
                wire: adapter,
                isCustom,
                hasOverrides,
                hasRamlArtifact,
                hasOfflineTests,
                needsOfflineTest,
            });
        }
    });
});

const wiresNeedingTests = wires.filter((x) => x.needsOfflineTest).map((x) => x.wire);

const report = {
    missingTests: wiresNeedingTests,
    all: wires.sort((a, b) => (a.wire > b.wire ? 1 : -1)),
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));
