import { GetCommunityNavigationMenu as getCommunityNavigationMenu } from '../../../generated/artifacts/main';

describe('nav menu adapter config', () => {
    // TODO: enable as a part of W-7270344
    xit('throws an error if both id and dev name are supplied', async () => {
        let config: any = {
            communityId: 'ABC123',
            navigationLinkSetId: 'foo',
            navigationLinkSetDeveloperName: 'bar',
        };

        expect(() => getCommunityNavigationMenu({} as any)(config)).toThrow();
    });
});
