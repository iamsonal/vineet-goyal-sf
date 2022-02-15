import fs from 'fs';
import path from 'path';
import { sql } from '@databases/sqlite';
import { runMeasurement } from './utils/runMeasurement';
import { median, MEDIAN_BATCH_THRESHOLD } from './utils/utils';

import extract from 'extract-zip';

jest.setTimeout(30 * 60 * 1000);

const PERF_DATA_DIR = path.join(__dirname, 'data');

describe('Priming performance tests', () => {
    it('ingests record batches with a median time below the baseline', async () => {
        const recordingName = 'fullVpod';
        const source = path.join(PERF_DATA_DIR, `${recordingName}.zip`);
        const target = path.join(PERF_DATA_DIR, recordingName);
        const recordingFilename = `recording-${recordingName}.json`;

        if (!fs.existsSync(target)) {
            await extract(source, { dir: PERF_DATA_DIR });
        }

        const data = JSON.parse(fs.readFileSync(path.join(target, recordingFilename)).toString());

        const results = await runMeasurement(data, target);

        expect(median(results.measurements.measurementsMs)).toBeLessThan(MEDIAN_BATCH_THRESHOLD);
        const [countResult] = await results.db.query(sql`SELECT COUNT(1) FROM store`);
        expect(countResult['COUNT(1)']).toBeGreaterThan(1);
    });
});
