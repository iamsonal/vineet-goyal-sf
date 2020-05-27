import { Store, LDS, Environment } from '@ldsjs/engine';
import { notifyChangeFactory } from '../index';

describe('notify change', () => {
    it('does not refresh when record is not in store', () => {
        const mockNetworkAdapter = jest.fn();
        const mockLds = new LDS(new Environment(new Store(), mockNetworkAdapter));
        const getRecordNotifyChange = notifyChangeFactory(mockLds);
        getRecordNotifyChange([{ recordId: '123' }]);
        expect(mockNetworkAdapter).not.toHaveBeenCalled();
    });
});
