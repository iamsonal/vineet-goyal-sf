import {
    buildUiApiParams,
    fixParamsForAuraController,
    registerApiFamilyRoutes,
} from '../middlewares/utils';
import appRouter from '../router';
import { executeGlobalController } from 'aura';

describe('buildUiApiParams', () => {
    it('appends "Param" to desc, page, and sort parameters', () => {
        const result = buildUiApiParams(
            {
                desc: 'foo',
                page: 5,
                sort: 'bar',
            },
            {
                headers: {},
            }
        );

        expect(result).toHaveProperty('descParam', 'foo');
        expect(result).toHaveProperty('pageParam', 5);
        expect(result).toHaveProperty('sortParam', 'bar');
    });
});

describe('fixParamsForAuraController', () => {
    it('returns the original parameters when no changes are needed', () => {
        const params = { foo: 'bar' };
        const fixed = fixParamsForAuraController(params);

        expect(fixed).toBe(params);
    });

    it('appends "Param" to desc, page, and sort parameters', () => {
        const descValue = {},
            pageValue = {},
            sortValue = {};
        const params = {
            desc: descValue,
            page: pageValue,
            sort: sortValue,
        };
        const fixed = fixParamsForAuraController(params);

        expect(fixed).toHaveProperty('descParam', descValue);
        expect(fixed).toHaveProperty('pageParam', pageValue);
        expect(fixed).toHaveProperty('sortParam', sortValue);

        expect(fixed).not.toHaveProperty('desc');
        expect(fixed).not.toHaveProperty('page');
        expect(fixed).not.toHaveProperty('sort');
    });

    it('does not overwrite the supplied parameters when making changes', () => {
        const params = { page: 10 };
        const fixed = fixParamsForAuraController(params);

        expect(params).not.toBe(fixed);
        expect(params).not.toHaveProperty('pageParam');
        expect(params).toHaveProperty('page', 10);
    });
});

describe('registerApiFamilyRoutes', () => {
    it('appends "Param" to desc, page, and sort URL parameters', async () => {
        registerApiFamilyRoutes({
            fooAdapter: {
                method: 'get',
                predicate: (path: string) => path.startsWith('urlParamTest'),
                transport: { controller: 'fooController' },
            },
        });

        executeGlobalController.mockReset();
        executeGlobalController.mockReturnValueOnce(Promise.resolve({}));

        const resourceRequest = {
            baseUri: '',
            basePath: 'urlParamTest',
            method: 'get',
            body: null,
            queryParams: {},
            urlParams: {
                desc: 'desc',
                page: 7,
                sort: 'up',
            },
            headers: {},
        };
        const handler = appRouter.lookup(resourceRequest);
        await handler(resourceRequest);

        expect(executeGlobalController).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                descParam: 'desc',
                pageParam: 7,
                sortParam: 'up',
            }),
            expect.anything()
        );
    });

    it('appends "Param" to desc, page, and sort query parameters', async () => {
        registerApiFamilyRoutes({
            fooAdapter: {
                method: 'get',
                predicate: (path: string) => path.startsWith('queryParamTest'),
                transport: { controller: 'fooController' },
            },
        });

        executeGlobalController.mockReset();
        executeGlobalController.mockReturnValueOnce(Promise.resolve({}));

        const resourceRequest = {
            baseUri: '',
            basePath: 'urlParamTest',
            method: 'get',
            body: null,
            queryParams: {
                desc: 'desc',
                page: 42,
                sort: 'up',
            },
            urlParams: {},
            headers: {},
        };
        const handler = appRouter.lookup(resourceRequest);
        await handler(resourceRequest);

        expect(executeGlobalController).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                descParam: 'desc',
                pageParam: 42,
                sortParam: 'up',
            }),
            expect.anything()
        );
    });
});
