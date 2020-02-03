import { LayoutType } from './index';

export default function coerceLayoutType(value: unknown): LayoutType | undefined {
    if (value === LayoutType.Full || value === LayoutType.Compact) {
        return value;
    }
    return undefined;
}
