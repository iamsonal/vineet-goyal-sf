import ldsEngineCreator from '../main';

describe('ldsEngineCreator', () => {
    it("returns { name: 'ldsEngineCreator' }", () => {
        const result = ldsEngineCreator();
        expect(result).toEqual({ name: 'ldsEngineCreator' });
    });
});
