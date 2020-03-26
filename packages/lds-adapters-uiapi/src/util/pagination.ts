import { CustomSelection, PathSelection, Reader } from '@ldsjs/engine';

function paginatedDataCustomReader(
    key: string,
    selection: CustomSelection<any>,
    record: any,
    data: any,
    variables: any,
    reader: Reader<any>
): void {
    const nonCustomSelection: any = {
        name: selection.name,
        plural: true,
        pageToken: selection.pageToken,
        pageSize: selection.pageSize,
        tokenDataKey: selection.tokenDataKey,
    };

    if (record[selection.name] && record[selection.name][0] && record[selection.name][0].__ref) {
        nonCustomSelection.kind = 'Link';
        nonCustomSelection.fragment = {
            kind: 'Fragment',
            selections: selection.selections,
        };
        reader.readPluralLink(key, nonCustomSelection, record, data);
    } else {
        nonCustomSelection.kind = 'Object';
        nonCustomSelection.selections = selection.selections;
        reader.readPluralObject(key, nonCustomSelection, record, data);
    }

    const pagination = reader.pagination(selection.tokenDataKey!);
    variables.__pageSize = selection.pageSize;

    const currentOffset = pagination.offsetFor(selection.pageToken)!;
    const nextOffset = currentOffset + selection.pageSize!;
    const previousOffset = currentOffset - selection.pageSize!;

    // count
    variables.count = data[selection.name].length;

    // current/next/previousPageToken
    variables.currentPageToken = selection.pageToken || pagination.defaultToken();

    const nextPageToken = pagination.isPastEnd(nextOffset) ? null : pagination.tokenFor(nextOffset);
    if (nextPageToken !== undefined) {
        variables.nextPageToken = nextPageToken;
    }

    const previousPageToken = previousOffset < 0 ? null : pagination.tokenFor(previousOffset);
    if (previousPageToken !== undefined) {
        variables.previousPageToken = previousPageToken;
    }

    // current/next/previousPageUrls cannot be generated until we have a template url
}

function variablesCustomReader(
    key: string,
    selection: CustomSelection<any>,
    record: any,
    data: any,
    variables: any,
    reader: Reader<any>
): void {
    reader.readScalar(selection.name, variables, data);
}

function urlCustomReader(
    key: string,
    selection: CustomSelection<any>,
    record: any,
    data: any,
    variables: any,
    reader: Reader<any>
): void {
    let urlProp = selection.name;
    let tokenProp = `${urlProp.substring(0, urlProp.indexOf('Url'))}Token`;

    if (variables[tokenProp]) {
        // currentPageUrl should never be empty so use that as the template
        variables[urlProp] = record.currentPageUrl
            .replace(/pageToken=[^&]+/, `pageToken=${variables[tokenProp]}`)
            .replace(/pageSize=\d+/, `pageSize=${variables.__pageSize}`);
    } else if (variables[tokenProp] === null) {
        variables[urlProp] = null;
    }

    reader.readScalar(selection.name, variables, data);
}

/**
 * Constructs a PathSelection[] to have Reader correctly populate paginated data
 * and metadata in a Snapshot. The metadata is assumed to follow the standard
 * UI API naming conventions: count, currentPageToken, currentPageUrl,
 * nextPageToken, nextPageUrl, previousPageToken, and previousPageUrl.
 *
 * @param config.name name of the field containing the paginated data
 * @param config.pageSize number of items to be included
 * @param config.pageToken token corresponding to starting offset
 * @param config.selections PathSelection[] to apply to each item
 * @param config.tokenDataKey store key of the pagination data
 * @returns PathSelection[] to populate the paginated data and associated metadata
 */
export function pathSelectionsFor(config: {
    name: string;
    pageSize: number;
    pageToken?: string;
    selections: PathSelection[];
    tokenDataKey: string;
}): PathSelection[] {
    return [
        {
            kind: 'Custom',
            name: config.name,
            pageToken: config.pageToken,
            pageSize: config.pageSize,
            plural: true,
            reader: paginatedDataCustomReader,
            selections: config.selections,
            tokenDataKey: config.tokenDataKey,
        },
        {
            kind: 'Custom',
            name: 'count',
            reader: variablesCustomReader,
        },
        {
            kind: 'Custom',
            name: 'currentPageToken',
            reader: variablesCustomReader,
        },
        {
            kind: 'Custom',
            name: 'currentPageUrl',
            reader: urlCustomReader,
        },
        {
            kind: 'Custom',
            name: 'nextPageToken',
            reader: variablesCustomReader,
        },
        {
            kind: 'Custom',
            name: 'nextPageUrl',
            reader: urlCustomReader,
        },
        {
            kind: 'Custom',
            name: 'previousPageToken',
            reader: variablesCustomReader,
        },
        {
            kind: 'Custom',
            name: 'previousPageUrl',
            reader: urlCustomReader,
        },
    ];
}

/**
 * Returns a PathSelection that injects a predetermined value at the specified name.
 *
 * @param config.name key associated with the value
 * @param config.value value to be injected
 */
export function staticValuePathSelection(config: { name: string; value: any }): PathSelection {
    return {
        kind: 'Custom',
        name: config.name,
        reader: (
            key: string,
            _selection: CustomSelection<any>,
            _record: any,
            data: any,
            _variables: any,
            _reader: Reader<any>
        ) => {
            data[key] = config.value;
        },
    };
}

/**
 * Examines a set of paginated data & metadata from an UnfulfilledSnapshot and computes a
 * pageToken and pageSize that will minimize the amount of data requested while still
 * satisfying the original request.
 *
 * @param config.name name of the field within data that contains the items
 * @param conifg.data paginated data/metadata from an UnfulfilledSnapshot
 * @param config.pageSize requested pageSize
 * @param config.pagination pagination data/functions from engine
 * @returns pageToken & pageSize to fill in the missing data
 */
export function minimizeRequest(config: {
    name: string;
    data: any | null;
    pageToken: string | undefined;
    pageSize: number;
    pagination: any;
}): { pageToken: string | undefined; pageSize: number } {
    // the only way to handle missing current or previous token is to ask for the full set of requested records
    if (!config.data || !config.data[config.name] || config.data.previousPageToken === undefined) {
        return {
            pageSize: config.pageSize,
            pageToken: config.pageToken,
        };
    } else {
        // compute the offset of the last record that was found
        const pageTokenOffset = config.pagination.offsetFor(config.data.currentPageToken)!;
        const lastFoundOffset = pageTokenOffset + config.data[config.name].length;

        // backup to the nearest offset for which we have a token
        const [newToken, newOffset] = config.pagination.tokenForAtMost(lastFoundOffset);

        // recompute pageToken and pageSize for query based on new starting token
        return {
            pageSize: pageTokenOffset - newOffset + config.pageSize,
            pageToken: newToken,
        };
    }
}
