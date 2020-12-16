/**
 * Observability / Critical Availability Program (230+)
 *
 * This file is intended to be used as a consolidated place for all definitions, functions,
 * and helpers related to "M1"[1].
 *
 * Below are the R.E.A.D.S. metrics for the Lightning Data Service, defined here[2].
 *
 * [1] https://salesforce.quip.com/NfW9AsbGEaTY
 * [2] https://salesforce.quip.com/1dFvAba1b0eq
 */

export const OBSERVABILITY_NAMESPACE = 'LIGHTNING.lds.service';
export const ADAPTER_INVOCATION_COUNT_METRIC_NAME = 'request';
export const ADAPTER_ERROR_COUNT_METRIC_NAME = 'error';
