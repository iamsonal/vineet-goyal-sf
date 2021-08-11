import { DispatchActionConfig } from './utils';

export const UI_API_BASE_URI = '/services/data/v54.0/ui-api';

const ACTION_CONFIG = {
    background: false,
    hotspot: true,
    longRunning: false,
};

export const actionConfig: DispatchActionConfig = {
    action: ACTION_CONFIG,
};
