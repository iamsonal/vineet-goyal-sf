declare module 'wire-service' {
    export const ValueChangedEvent: any;
    export const register: (identifier: () => void, handler: (evt: EventTarget) => void) => void;
}
