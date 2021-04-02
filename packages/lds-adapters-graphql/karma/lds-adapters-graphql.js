import { createLDSAdapter } from 'force/ldsBindings';

import { graphQLAdapterFactory } from '../dist/es/es2018/graphql-service';

export const graphql = createLDSAdapter('graphql', graphQLAdapterFactory);
