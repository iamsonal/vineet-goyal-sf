declare module '@salesforce/gate/lds.useNewTrackedFieldBehavior' {
    interface Gate {
        isOpen: (config: { fallback: boolean }) => boolean;
    }

    const gate: Gate;
    export default gate;
}
