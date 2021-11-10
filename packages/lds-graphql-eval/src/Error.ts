interface MissingObjectInfoError {
    type: 'MissingObjectInfoError';
    object: string;
}

export interface MessageError {
    type: 'MessageError';
    message: string;
}

export function message(message: string): PredicateError {
    return { type: 'MessageError', message };
}

export function missingObjectInfo(object: string): PredicateError {
    return { type: 'MissingObjectInfoError', object };
}

export type PredicateError = MissingObjectInfoError | MessageError;

export function isMissingObjectInfoError(node: PredicateError): node is MissingObjectInfoError {
    return node.type === 'MissingObjectInfoError';
}
