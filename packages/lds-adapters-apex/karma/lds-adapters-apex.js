import { getApexInvoker, getSObjectValue } from '../sfdc/index';

import { refresh as refreshApex } from 'force/ldsBindings';

const apexContactControllerGetContactList = getApexInvoker(
    '',
    'ContactController',
    'getContactList',
    false
);

export { refreshApex, apexContactControllerGetContactList, getSObjectValue };
