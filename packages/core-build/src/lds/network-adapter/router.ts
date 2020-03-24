import { ResourceRequest } from '@ldsjs/engine';

import { ObjectCreate } from '../../utils/language';

type RoutePredicate = (path: string) => boolean;
type ResourceRequestHandler = (resource: ResourceRequest) => Promise<any>;

export interface Route {
    predicate: RoutePredicate;
    handler: ResourceRequestHandler;
}

const router = ObjectCreate(null);
router.methods = {} as Record<string, Route[]>;

['delete', 'post', 'patch', 'get'].forEach(method => {
    router[method] = function(predicate: RoutePredicate, handler: ResourceRequestHandler) {
        const routes = this.methods[method] || [];
        routes.push({ predicate, handler });
        this.methods[method] = routes;
    };
});

export default router;
