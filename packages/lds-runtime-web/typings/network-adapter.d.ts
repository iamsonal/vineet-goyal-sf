declare module '@salesforce/lds-network' {
    import { ResourceRequest } from '@luvio/engine';
    export default function networkAdapter(resourceRequest: ResourceRequest): Promise<any>;
}
