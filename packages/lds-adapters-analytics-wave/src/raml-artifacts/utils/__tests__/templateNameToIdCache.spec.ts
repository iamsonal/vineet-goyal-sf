import { templateApiName } from '../templateNameToIdCache';

describe('templateApiName', () => {
    it('works with namespace', () => {
        expect(templateApiName({ name: 'foo', namespace: 'ns' })).toEqual('ns__foo');
    });

    it('works with no namespace', () => {
        expect(templateApiName({ name: 'foo' })).toEqual('foo');
    });

    it('works with empty namespace', () => {
        expect(templateApiName({ name: 'foo', namespace: '' })).toEqual('foo');
    });

    it('works with null namespace', () => {
        expect(templateApiName({ name: 'foo', namespace: null })).toEqual('foo');
    });
});
