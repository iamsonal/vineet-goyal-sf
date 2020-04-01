import { ResourceRequest } from '@ldsjs/engine';

import { ControllerInvoker } from './middlewares/utils';
import { ObjectCreate } from '../../utils/language';

type RoutePredicate = (path: string) => boolean;

export interface Route {
    predicate: RoutePredicate;
    handler: ControllerInvoker;
}

const router = ObjectCreate(null);
router.methods = {} as Record<string, Route[]>;

['delete', 'post', 'patch', 'get'].forEach(method => {
    router[method] = function(predicate: RoutePredicate, handler: ControllerInvoker) {
        const routes = this.methods[method] || [];
        routes.push({ predicate, handler });
        this.methods[method] = routes;
    };
});

router.lookup = function(resourceRequest: ResourceRequest): ControllerInvoker | null {
    const { baseUri, basePath, method } = resourceRequest;
    const path = `${baseUri}${basePath}`;
    const routes: Route[] = this.methods[method];
    if (routes === undefined || routes.length === 0) {
        return null;
    }

    const matchedRoute = routes.find(route => route.predicate(path));
    if (matchedRoute !== undefined) {
        return matchedRoute.handler;
    } else {
        return null;
    }
};

export default router;
