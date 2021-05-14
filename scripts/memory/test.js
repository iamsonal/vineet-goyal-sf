import testMemory from './testMemory.js';
import prettyBytes from 'pretty-bytes';
import tests from './allTests';

async function main() {
    let testFailures = 0;

    for (const test of tests) {
        const memoryUsage = await testMemory(test.before, test.func);
        const failed = test.maximum < memoryUsage;
        if (failed) {
            testFailures++;
        }
        const failOrSuccessIcon = failed ? '\u274C' : '\u2705';

        // eslint-disable-next-line no-console
        console.log(
            `${failOrSuccessIcon} ${test.name} - ` +
                `usage: ${prettyBytes(memoryUsage)}, max: ${prettyBytes(test.maximum)}, ` +
                `diff: ${prettyBytes(memoryUsage - test.maximum)}`
        );
    }

    if (testFailures) {
        // eslint-disable-next-line no-console
        console.log(`${testFailures} test(s) have failed`);
        process.exit(1);
    } else {
        // eslint-disable-next-line no-console
        console.log('All tests passed!');
    }
}

main().catch((err) => {
    console.error(err); // eslint-disable-line no-console
    process.exit(1);
});
