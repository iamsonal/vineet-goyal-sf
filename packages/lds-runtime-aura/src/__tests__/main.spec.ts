import ldsEngineCreator from '../main';
import { initializeLDS } from '../main';

describe('ldsEngineCreator', () => {
    it('exports an initializeLDS function', () => {
        initializeLDS();
    });

    it("returns { name: 'ldsEngineCreator' }", () => {
        const result = ldsEngineCreator();
        expect(result).toEqual({ name: 'ldsEngineCreator' });
    });
});
