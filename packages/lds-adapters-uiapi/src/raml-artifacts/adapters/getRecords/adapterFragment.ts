import { Fragment, LDS } from '@ldsjs/engine';
import { selectChildResourceParams } from '../../resources/getUiApiRecordsBatchByRecordIds/selectChildResourceParams';
import { GetRecordsConfig } from './GetRecordsConfig';
import { createChildResourceParams } from './createChildResourceParams';

export function adapterFragment(lds: LDS, config: GetRecordsConfig): Fragment {
    const childResources = createChildResourceParams(config);
    return selectChildResourceParams(lds, childResources);
}
