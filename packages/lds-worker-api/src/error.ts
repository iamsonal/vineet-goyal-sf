export function isNotAFunctionError(error: unknown) {
    if (error instanceof Error) {
        return error.message.includes(' is not a constructor');
    }

    return false;
}
