import {
    Environment,
    ResourceRequest,
    Store,
    UnfulfilledSnapshot,
    ResourceResponse,
} from '@ldsjs/engine';
import { DurableStore } from '@ldsjs/environments';
import { handlers } from '../generated/records/revival';

// the purpose of this environment is to intercept network requests that are bringing in records and ensure
// the incoming records revived from the durable store prior to ingestion for proper merging
export function makeDurableRecordAware(
    env: Environment,
    durableStore: DurableStore,
    store: Store
): Environment {
    const resolveUnfulfilledSnapshot: typeof env['resolveUnfulfilledSnapshot'] = function<T>(
        request: ResourceRequest,
        snapshot: UnfulfilledSnapshot<T, any>
    ) {
        return env
            .resolveUnfulfilledSnapshot<T>(request, snapshot)
            .then((result: ResourceResponse<T>) => {
                for (let i = 0, len = handlers.length; i < len; i++) {
                    const handler = handlers[i];
                    if (handler.canRevive(request)) {
                        return handler.revive(result, store, durableStore).then(() => {
                            return result;
                        });
                    }
                }

                return result;
            });
    };

    return Object.create(env, {
        resolveUnfulfilledSnapshot: {
            value: resolveUnfulfilledSnapshot,
        },
    });
}
