import { Instrumentation } from 'o11y/client';
import { instrumentation } from './instrumentation';

export { activity } from './activity';
export { instrumentation } from './instrumentation';
export { idleDetector } from './idleDetector';

export function getInstrumentation(_name: string): Instrumentation {
    return instrumentation;
}
