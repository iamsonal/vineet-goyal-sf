import { FormFactor } from './index';

export default function coerceFormFactor(form: unknown): FormFactor | undefined {
    if (form === FormFactor.Large || form === FormFactor.Medium || form === FormFactor.Small) {
        return form;
    }
    return undefined;
}
