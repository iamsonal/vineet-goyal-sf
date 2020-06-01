import { CompilerPlugin } from '@ldsjs/compiler';
import { validate } from './validation';

const plugin: CompilerPlugin = { validate };

export default plugin;
