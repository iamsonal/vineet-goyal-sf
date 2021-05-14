/* global gc */
async function doGC() {
    gc();
    await new Promise((resolve) => setTimeout(resolve, 5000)); // allow memory to actually be cleared
}

export default async function testMemory(before, func) {
    const beforeResult = before && (await before());
    await doGC();
    const beforeStats = process.memoryUsage();

    await func(beforeResult);

    await doGC();
    const afterStats = process.memoryUsage();

    return afterStats.heapUsed - beforeStats.heapUsed;
}
