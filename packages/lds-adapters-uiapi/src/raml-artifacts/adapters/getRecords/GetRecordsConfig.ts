export type GetRecordsEntityConfiguration = {
    recordIds: string[];
} & (
    | {
          fields: string[];
          optionalFields: string[];
      }
    | {
          fields?: void;
          optionalFields: string[];
      }
    | {
          fields: string[];
          optionalFields?: void;
      }
);

export interface GetRecordsConfig {
    records: GetRecordsEntityConfiguration[];
}
