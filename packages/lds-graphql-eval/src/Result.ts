import { PredicateContainer } from './Predicate';

export type PredicateResult = Result<PredicateContainer, PredicateError[]>;

export type Result<T, E> = Success<T, E> | Failure<T, E>;
interface BaseResult<T, E> {
    isSuccess: boolean;
    map: <S>(fn: (v: T) => S) => Result<S, E>;
}

export interface Success<T, E> extends BaseResult<T, E> {
    value: T;
    isSuccess: true;
}

export interface Failure<T, E> extends BaseResult<T, E> {
    error: E;
    isSuccess: false;
}

export function success<T, E>(value: T): Success<T, E> {
    return {
        value,
        isSuccess: true,
        map: (f) => success(f(value)),
    };
}

export function failure<T, E>(error: E): Failure<T, E> {
    return {
        error,
        isSuccess: false,
        map: (_) => failure(error),
    };
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T, E> {
    return result.isSuccess;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<T, E> {
    return result.isSuccess === false;
}

export function errors<S, T>(result: Failure<S, T>): T {
    return result.error;
}

export function values<S, T>(result: Success<S, T>): S {
    return result.value;
}

export function unwrappedValue<V, T>(r: Result<V, T>): V | undefined {
    if (r.isSuccess) {
        return r.value;
    }

    return undefined;
}

export function unwrappedError<V, T>(r: Result<V, T>): T | undefined {
    if (r.isSuccess === false) {
        return r.error;
    }

    return undefined;
}

export type PredicateError = string;
