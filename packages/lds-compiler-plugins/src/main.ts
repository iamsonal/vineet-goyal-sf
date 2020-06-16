import { CompilerPlugin } from '@ldsjs/compiler';
import { validate } from './validation';
import { afterGenerate } from './after-generate';

const plugin: CompilerPlugin = { validate, afterGenerate };

export default plugin;
