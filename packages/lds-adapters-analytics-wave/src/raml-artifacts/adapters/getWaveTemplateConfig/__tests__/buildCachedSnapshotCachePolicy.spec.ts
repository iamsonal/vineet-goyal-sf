import { Environment, Luvio, Snapshot, Store } from '@luvio/engine';
import { TemplateConfigurationRepresentation } from '../../../../generated/types/TemplateConfigurationRepresentation';
import { buildCachedSnapshotCachePolicy as generatedBuildCachedSnapshotCachePolicy } from '../../../../generated/adapters/getWaveTemplateConfig';
import { GetWaveTemplateConfigConfig } from '../../../../generated/adapters/getWaveTemplateConfig';
import { buildCachedSnapshotCachePolicy } from '../buildCachedSnapshotCachePolicy';
import { templateNameToIdCache } from '../../../utils/templateNameToIdCache';

jest.mock('../../../../generated/adapters/getWaveTemplateConfig', () => {
    return {
        buildCachedSnapshotCachePolicy: jest
            .fn()
            .mockReturnValue({} as Snapshot<TemplateConfigurationRepresentation>),
    };
});

describe('buildCachedSnapshotCachePolicy', () => {
    afterEach(() => {
        templateNameToIdCache.clear();
        jest.clearAllMocks();
    });

    const luvio = new Luvio(new Environment(new Store(), jest.fn()));

    it('calls generated method once on empty nameToIdCache', () => {
        const config: GetWaveTemplateConfigConfig = { templateIdOrApiName: '0Nkxx0000004FICCA2' };
        buildCachedSnapshotCachePolicy({ luvio, config }, luvio.storeLookup);

        expect(generatedBuildCachedSnapshotCachePolicy).toHaveBeenCalledTimes(1);
        expect(generatedBuildCachedSnapshotCachePolicy).toHaveBeenLastCalledWith(
            { luvio, config },
            luvio.storeLookup
        );
    });

    it('calls generated method once on nameToIdCache match with snapshot data', () => {
        const templateName = 'Foo';
        const templateId = '0Nkxx0000004FICCA2';
        templateNameToIdCache.set(templateName, templateId);
        buildCachedSnapshotCachePolicy(
            { luvio, config: { templateIdOrApiName: templateName } },
            luvio.storeLookup
        );

        expect(generatedBuildCachedSnapshotCachePolicy).toHaveBeenCalledTimes(1);
        expect(generatedBuildCachedSnapshotCachePolicy).toHaveBeenLastCalledWith(
            {
                luvio,
                config: {
                    templateIdOrApiName: templateId,
                },
            },
            luvio.storeLookup
        );
    });
});
