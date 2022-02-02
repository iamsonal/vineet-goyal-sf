import { NameToIdCache } from './nameToIdCache';

export const templateNameToIdCache = new NameToIdCache();

export function templateApiName({ name, namespace }: { name: string; namespace?: string | null }) {
    return namespace ? `${namespace}__${name}` : name;
}
