import { Environment, Luvio, Store } from '@luvio/engine';
import { buildNetworkSnapshot as generatedBuildNetworkSnapshot } from '../../../../generated/adapters/deleteDataset';
import { DeleteDatasetConfig } from '../../../../generated/adapters/deleteDataset';
import { buildNetworkSnapshot } from '../buildNetworkSnapshot';
import { datasetNameToIdCache } from '../../../utils/datasetNameToIdCache';

const mockError = { error: 'Error deleting dataset' };
jest.mock('../../../../generated/adapters/deleteDataset', () => {
    return {
        buildNetworkSnapshot: jest
            .fn()
            .mockImplementationOnce(() => Promise.resolve())
            .mockImplementationOnce(() => Promise.reject(mockError)),
    };
});

describe('buildNetworkSnapshot', () => {
    afterEach(() => {
        datasetNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    it('calls generated method and clears nameToIdCache on resolved promise', async () => {
        const datasetName = 'Foo';
        const datasetId = '0Fbxx0000004Cx3CAE';
        datasetNameToIdCache.set(datasetName, datasetId);
        const config: DeleteDatasetConfig = { datasetIdOrApiName: 'Foo' };
        await buildNetworkSnapshot(luvio, config);
        expect(generatedBuildNetworkSnapshot).toHaveBeenCalledTimes(1);
        expect(datasetNameToIdCache.get('Foo')).toBeUndefined();
    });

    it('calls generated method and does not clear nameToIdCache on rejected promise', async () => {
        const datasetName = 'Foo';
        const datasetId = '0Fbxx0000004Cx3CAE';
        datasetNameToIdCache.set(datasetName, datasetId);
        const config: DeleteDatasetConfig = { datasetIdOrApiName: 'Foo' };
        try {
            await buildNetworkSnapshot(luvio, config);
            throw new Error('buildNetworkSnapshot should fail');
        } catch (error) {
            expect(generatedBuildNetworkSnapshot).toHaveBeenCalledTimes(1);
            expect(datasetNameToIdCache.get('Foo')).toEqual(datasetId);
            expect(error).toEqual(mockError);
        }
    });
});
