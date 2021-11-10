import { BuildNetworkSnapshot, DispatchResourceRequest, Luvio } from '@luvio/engine';

/**
 * Returns a BuildNetworkSnapshot function that always returns a Promise<ErrorSnapshot>.
 *
 * @param luvio Luvio instance
 * @param status status code for ErrorSnapshot, defaults to 400
 * @param statusText status text for ErrorSnapshot, defaults to 'data is not fetchable'
 * @returns BuildNetowrkSnapshot that always returns Promise<ErrorSnapshot>
 */
export function buildNotFetchableNetworkSnapshot<C, D>(
    luvio: Luvio,
    status: number = 400,
    statusText: string = 'data is not fetchable'
): BuildNetworkSnapshot<C, D> {
    return <C, D>(_context: C, _dispatchResourceRequest: DispatchResourceRequest<D>) =>
        Promise.resolve(
            luvio.errorSnapshot({
                status,
                statusText,
                ok: false,
                body: undefined,
                headers: {},
            })
        );
}
