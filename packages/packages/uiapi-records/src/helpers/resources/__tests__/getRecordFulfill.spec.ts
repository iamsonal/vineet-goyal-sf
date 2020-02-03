import { ResourceRequest } from '@salesforce-lds/engine';
import fulfill from '../getRecordFulfill';

function buildResourceRequest(resourceRequest: Partial<ResourceRequest>): ResourceRequest {
    return {
        method: resourceRequest.method || 'get',
        path: resourceRequest.path || '/test',
        body: resourceRequest.body || {},
        queryParams: resourceRequest.queryParams || {},
        urlParams: resourceRequest.urlParams || {},
        key: resourceRequest.key || 'key',
        headers: resourceRequest.headers || {},
        ingest: (() => {}) as any,
    };
}

describe('fulfills', () => {
    it('does not fulfill for incoming with layout', () => {
        const existing = buildResourceRequest({});
        const incoming = buildResourceRequest({ queryParams: { layoutTypes: ['Full'] } });
        expect(fulfill(existing, incoming)).toBe(false);
    });

    it('does not fulfill for unequal paths', () => {
        const existing = buildResourceRequest({});
        const incoming = buildResourceRequest({ path: '/other' });
        expect(fulfill(existing, incoming)).toBe(false);
    });

    it('does not fulfill for unequal headers', () => {
        const existing = buildResourceRequest({ headers: { 'Cache-Control': 'no-cache' } });
        const incoming = buildResourceRequest({ headers: {} });
        expect(fulfill(existing, incoming)).toBe(false);
    });

    it('fulfills for equal empty headers', () => {
        const existing = buildResourceRequest({ headers: {} });
        const incoming = buildResourceRequest({ headers: {} });
        expect(fulfill(existing, incoming)).toBe(true);
    });

    it('fulfills for equal non-empty headers', () => {
        const existing = buildResourceRequest({ headers: { 'Cache-Control': 'no-cache' } });
        const incoming = buildResourceRequest({ headers: { 'Cache-Control': 'no-cache' } });
        expect(fulfill(existing, incoming)).toBe(true);
    });

    it('fulfills requests for identical fields', () => {
        const fields = ['A', 'B', 'C'];
        const existing = buildResourceRequest({ queryParams: { fields } });
        const incoming = buildResourceRequest({ queryParams: { fields } });
        expect(fulfill(existing, incoming)).toBe(true);
    });

    it('dedupe requests for identical optionalFields', () => {
        const optionalFields = ['A', 'B', 'C'];
        const existing = buildResourceRequest({ queryParams: { optionalFields } });
        const incoming = buildResourceRequest({ queryParams: { optionalFields } });
        expect(fulfill(existing, incoming)).toBe(true);
    });

    it('dedupe requests for identical fields and optionalFields union', () => {
        const existing = buildResourceRequest({
            queryParams: { fields: ['A', 'B'], optionalFields: ['C'] },
        });
        const incoming = buildResourceRequest({
            queryParams: { fields: ['A'], optionalFields: ['B', 'C'] },
        });
        expect(fulfill(existing, incoming)).toBe(true);
    });
});
