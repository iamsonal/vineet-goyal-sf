declare module '@salesforce/lds-network' {
    import { ResourceRequest } from '@ldsjs/engine';
    export default function networkAdapter(resourceRequest: ResourceRequest): Promise<any>;
}
