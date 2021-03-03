import { rollup } from '../../scripts/rollup/rollup.config.adapters';
import path from 'path';

const sfdcEntry = path.join(__dirname, 'src', 'generated', 'artifacts', 'sfdc.ts');
const entry = path.join(__dirname, 'src', 'generated', 'artifacts', 'main.ts');

export default rollup({
    cwd: __dirname,
    sfdcEntry,
    entry,
    fileName: 'community-sites-search',
    bundleName: 'communitySites-search',
});
