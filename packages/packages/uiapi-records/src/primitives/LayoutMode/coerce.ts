import { LayoutMode } from './index';

export default function coerceLayoutMode(value: unknown): LayoutMode | undefined {
    if (value === LayoutMode.Create || value === LayoutMode.Edit || value === LayoutMode.View) {
        return value;
    }

    return undefined;
}
