import type { GetLayoutUserStateConfig as originalConfig } from '../../../generated/adapters/getLayoutUserState';

export type GetLayoutUserStateConfig = Omit<Required<originalConfig>, 'formFactor'>;
