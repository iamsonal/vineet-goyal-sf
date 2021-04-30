import { setDefaultLuvio } from 'force/ldsEngine';

export default function() {
    const luvio = {
        withContext: jest.fn(),
    };
    setDefaultLuvio({ luvio });
}
