import { Fragment, Luvio } from '@luvio/engine';
import { selectChildResourceParams } from '../../resources/getUiApiRecordsBatchByRecordIds/selectChildResourceParams';
import { GetRecordsConfig } from './GetRecordsConfig';
import { createChildResourceParams } from './createChildResourceParams';
import { createResourceParams } from './createResourceParams';

export function adapterFragment(luvio: Luvio, config: GetRecordsConfig): Fragment {
    const childResources = createChildResourceParams(config);
    const resourceParams = createResourceParams(config);
    return selectChildResourceParams(luvio, childResources, resourceParams);
}
