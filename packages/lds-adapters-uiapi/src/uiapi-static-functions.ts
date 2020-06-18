/**
 * Record Util Pure Functions
 * These functions are in their own module
 * because we need compat transform to apply
 * to these functions
 */
export {
    createRecordInputFilteredByEditedFields,
    generateRecordInputForCreate,
    generateRecordInputForUpdate,
    getFieldDisplayValue,
    getRecordInput,
    getFieldValue,
} from './util/records';
