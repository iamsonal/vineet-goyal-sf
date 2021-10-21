import { PredicateContainer } from './Predicate';

export type PredicateResult = Result<PredicateContainer, PredicateError[]>;

export type Result<T, E> = Success<T, E> | Failure<T, E>;
interface BaseResult<T, E> {
    isSuccess: boolean;
    map: <S>(fn: (v: T) => S) => Result<S, E>;
    flatMap: <S>(fn: (v: T) => Result<S, E>) => Result<S, E>;
    mapError: <U>(fn: (e: E) => U) => Result<T, U>;
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
        flatMap: (f) => f(value),
        mapError: (_) => success(value),
    };
}

export function failure<T, E>(error: E): Failure<T, E> {
    return {
        error,
        isSuccess: false,
        map: (_) => failure(error),
        flatMap: (_) => failure(error),
        mapError: (f) => failure(f(error)),
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

export function flattenResults<S, E>(results: Result<S, E>[]): Result<S[], E[]> {
    const fails = results.filter(isFailure).map(errors);

    if (fails.length > 0) {
        return failure(fails);
    }

    return success(results.filter(isSuccess).map(values));
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
