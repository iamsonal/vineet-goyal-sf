import { ResourceRequest, ResourceRequestContext } from '@luvio/engine';
import { Response } from '@mobileplatform/nimbus-plugin-lds';

import { buildNimbusNetworkPluginRequest, buildLdsResponse } from '../network/networkUtils';

describe('networkUtils', () => {
    describe('buildNimbusNetworkPluginRequest', () => {
        it('properly builds a plugin Request from ResourceRequest', () => {
            const resourceRequest: ResourceRequest = {
                baseUri: '/base/uri',
                basePath: '/foo/123',
                method: 'get',
                priority: 'normal',
                body: {},
                headers: { 'Foo-Header': 'Bar' },
                queryParams: { q1: 'q1Value', q2: 'q2Value' },
                urlParams: { id: '123' },
            };

            const result = buildNimbusNetworkPluginRequest(resourceRequest);

            expect(result).toEqual({
                method: 'GET',
                observabilityContext: null,
                body: '{}',
                headers: { 'Foo-Header': 'Bar' },
                path: '/base/uri/foo/123',
                priority: 'normal',
                queryParams: { q1: 'q1Value', q2: 'q2Value' },
            });
        });

        it('properly builds the observability context', () => {
            // Arrange
            const resourceRequest: ResourceRequest = {
                baseUri: '/base/uri',
                basePath: '/foo/123',
                method: 'get',
                priority: 'normal',
                body: {},
                headers: { 'Foo-Header': 'Bar' },
                queryParams: { q1: 'q1Value', q2: 'q2Value' },
                urlParams: { id: '123' },
            };

            const resourceRequestContext: ResourceRequestContext = {
                requestCorrelator: {
                    observabilityContext: {
                        rootId: 'app-priming',
                        isRootActivitySampled: true,
                        traceId: 'uuid-some-uuid',
                    },
                },
            };

            // Act
            const result = buildNimbusNetworkPluginRequest(resourceRequest, resourceRequestContext);

            // Assert
            expect(result).toEqual({
                method: 'GET',
                observabilityContext: {
                    rootId: 'app-priming',
                    isRootActivitySampled: true,
                    traceId: 'uuid-some-uuid',
                },
                body: '{}',
                headers: { 'Foo-Header': 'Bar' },
                path: '/base/uri/foo/123',
                priority: 'normal',
                queryParams: { q1: 'q1Value', q2: 'q2Value' },
            });
        });

        it('handles queryParam with array', () => {
            const resourceRequest: ResourceRequest = {
                baseUri: '/base/uri',
                basePath: '/foo',
                method: 'get',
                priority: 'normal',
                body: null,
                headers: {},
                queryParams: { qArray: ['test1', 'test2'] },
                urlParams: {},
            };

            const result = buildNimbusNetworkPluginRequest(resourceRequest);

            expect(result).toEqual({
                method: 'GET',
                observabilityContext: null,
                body: null,
                headers: {},
                path: '/base/uri/foo',
                priority: 'normal',
                queryParams: { qArray: 'test1,test2' },
            });
        });

        it('handles queryParam with JSON object', () => {
            const resourceRequest: ResourceRequest = {
                baseUri: '/base/uri',
                basePath: '/foo',
                method: 'get',
                priority: 'normal',
                body: null,
                headers: {},
                queryParams: { qObject: { test1: 1, test2: 2 } },
                urlParams: {},
            };

            const result = buildNimbusNetworkPluginRequest(resourceRequest);

            expect(result).toEqual({
                method: 'GET',
                observabilityContext: null,
                body: null,
                headers: {},
                path: '/base/uri/foo',
                priority: 'normal',
                queryParams: { qObject: '{"test1":1,"test2":2}' },
            });
        });

        it('handles queryParam with undefined values', () => {
            const resourceRequest: ResourceRequest = {
                baseUri: '/base/uri',
                basePath: '/foo',
                method: 'get',
                priority: 'normal',
                body: null,
                headers: {},
                queryParams: { qArray: ['test1', 'test2'], uValue: undefined },
                urlParams: {},
            };

            const result = buildNimbusNetworkPluginRequest(resourceRequest);

            expect(result).toEqual({
                method: 'GET',
                observabilityContext: null,
                body: null,
                headers: {},
                priority: 'normal',
                path: '/base/uri/foo',
                queryParams: { qArray: 'test1,test2' },
            });
        });

        it('handles body', () => {
            const body = { testBody: 'fooBody' };
            const resourceRequest: ResourceRequest = {
                baseUri: '/base/uri',
                basePath: '/foo',
                method: 'post',
                priority: 'normal',
                body,
                headers: {},
                queryParams: {},
                urlParams: {},
            };

            const result = buildNimbusNetworkPluginRequest(resourceRequest);

            expect(result).toEqual({
                method: 'POST',
                observabilityContext: null,
                body: JSON.stringify(body),
                headers: {},
                path: '/base/uri/foo',
                priority: 'normal',
                queryParams: {},
            });
        });
    });

    describe('buildLdsResponse', () => {
        it('properly builds FetchResponse from plugin response', () => {
            const body = { prop1: true, prop2: 'foo' };

            const response: Response = {
                status: 200,
                headers: { 'Response-Header': 'Works' },
                body: JSON.stringify(body),
            };

            const fetchResponse = buildLdsResponse(response);

            expect(fetchResponse).toEqual({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: { 'Response-Header': 'Works' },
                body,
            });
        });

        it('sets ok to false on non-ok status code', () => {
            const response: Response = {
                status: 404,
                headers: {},
                body: null,
            };

            const fetchResponse = buildLdsResponse(response);

            expect(fetchResponse).toEqual({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: {},
                body: null,
            });
        });

        it('handles undefined body', () => {
            const response: Response = {
                status: 404,
                headers: {},
                body: undefined,
            };

            const fetchResponse = buildLdsResponse(response);

            expect(fetchResponse).toEqual({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: {},
                body: null,
            });
        });

        it('handles null body', () => {
            const response: Response = {
                status: 404,
                headers: {},
                body: null,
            };

            const fetchResponse = buildLdsResponse(response);

            expect(fetchResponse).toEqual({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: {},
                body: null,
            });
        });

        it('handles empty string body', () => {
            const response: Response = {
                status: 404,
                headers: {},
                body: '',
            };

            const fetchResponse = buildLdsResponse(response);

            expect(fetchResponse).toEqual({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: {},
                body: null,
            });
        });
    });
});
