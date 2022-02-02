export interface SQLEvaluatingStore {
    /**
     * @returns true if the backing plugins available in the environment support
     * SQL evaluation and updating indices.
     *
     */
    isEvalSupported(): boolean;

    /**
     * Updates indices in the SQL database.  Each index SQL
     * should be written to only update the DB the first
     * time it is sent.
     *
     * @param indices An array of index SQL to apply
     * @returns A void promise.  If the indices can not be
     * updated, the promise will reject.
     */
    updateIndices(indices: string[]): Promise<void>;

    /**
     * Evaluates SQL on the durable store. evaluateSQL is intended
     * for SQL which returns results in a JSON encoded string.  The shape of the
     * returned JSON is determined by the JSON shape specified by the SQL. The results
     * should be be parsable by JSON.parse.
     *
     * @param sql The SQL query to evaluate
     * @param params An array of parameters corresponding to placeholders in the SQL
     * @returns A promise that returns the JSON encoded string.  The promise rejects when evaluation fails.
     */
    evaluateSQL(sql: string, params: string[]): Promise<string>;
}
