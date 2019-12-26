import { CustomSelection, Reader } from '@salesforce-lds/engine';

export function records(
    key: string,
    selection: CustomSelection<any>,
    record: any,
    data: any,
    variables: any,
    reader: Reader<any>
): void {
    reader.readPluralLink(
        key,
        {
            kind: 'Link',
            name: selection.name,
            plural: true,
            selections: selection.selections,
            pageToken: selection.pageToken,
            pageSize: selection.pageSize,
            tokenDataKey: selection.tokenDataKey,
        },
        record,
        data
    );

    const pagination = reader.pagination(selection.tokenDataKey!);
    variables.__pageSize = selection.pageSize;

    const currentOffset = pagination.offsetFor(selection.pageToken)!;
    const nextOffset = currentOffset + selection.pageSize!;
    const previousOffset = currentOffset - selection.pageSize!;

    // count
    variables.count = data.records.length;

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

export function variables(
    key: string,
    selection: CustomSelection<any>,
    record: any,
    data: any,
    variables: any,
    reader: Reader<any>
): void {
    reader.readScalar(selection.name, variables, data);
}

export function url(
    key: string,
    selection: CustomSelection<any>,
    record: any,
    data: any,
    variables: any,
    reader: Reader<any>
): void {
    let urlProp = selection.name;
    let tokenProp = `${urlProp.substring(0, urlProp.indexOf('Url'))}Token`;

    // TODO W-6741077 Remove this change when craig sets the currentPageUrl
    if (variables[tokenProp] && record.currentPageUrl) {
        // currentPageUrl should never be empty so use that as the template
        variables[urlProp] = record.currentPageUrl
            .replace(/pageToken=[^&]+/, `pageToken=${variables[tokenProp]}`)
            .replace(/pageSize=\d+/, `pageSize=${variables.__pageSize}`);
    } else if (variables[tokenProp] === null) {
        variables[urlProp] = null;
    }

    reader.readScalar(selection.name, variables, data);
}
