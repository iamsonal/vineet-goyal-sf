import { parseAndVisit } from '@luvio/graphql-parser';
import { transform } from '../ast-parser';
import { sql } from '../ast-to-sql';
import infoJson from './mockData/objectInfos.json';
import { unwrappedValue } from '../Result';
import { ObjectInfoMap } from '../info-types';

const objectInfoMap = infoJson as ObjectInfoMap;
const sqlMappingInput = {
    jsonColumn: 'TABLE_1_1',
    keyColumn: 'TABLE_1_0',
    jsonTable: 'TABLE_1',
};

const parserInput = {
    userId: 'MyId',
    objectInfoMap,
};

describe('filter sql', () => {
    describe('picklists', () => {
        const picklistQuery = (predicate) => {
            return /* GraphQL */ `
                query picklistPredicate {
                    uiapi {
                        query {
                            # ResourceType is a input type of Picklist
                            ServiceResource(where: { ResourceType: { ${predicate} }}) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        ResourceType {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;
        };
        it('should return the correct sql with Picklist filter predicates for eq operator', () => {
            const predicate = `eq: "T"`;
            const result = transform(parseAndVisit(picklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });

        it('should return the correct sql with Picklist filter predicates for ne operator', () => {
            const predicate = `ne: "T"`;
            const result = transform(parseAndVisit(picklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });

        it('should return the correct sql with Picklist filter predicates for IN operator', () => {
            const predicate = `in: ["T"]`;
            const result = transform(parseAndVisit(picklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });

        it('should return the correct sql with Picklist filter predicates for NIN operator', () => {
            const predicate = `nin: ["T"]`;
            const result = transform(parseAndVisit(picklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
    });

    describe('currency', () => {
        const currencyQuery = (predicate) => {
            return /* GraphQL */ `
                query currencyPredicate {
                    uiapi {
                        query {
                            Account(where: { AnnualRevenue: { ${predicate} } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name {
                                            value
                                        }
                                        AnnualRevenue {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;
        };
        it('should return the correct sql with currency filter predicates for eq operator', () => {
            const predicate = `eq: 123.45`;
            const result = transform(parseAndVisit(currencyQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
        it('should return the correct sql with currency filter predicates for ne operator', () => {
            const predicate = `ne: 123.45`;
            const result = transform(parseAndVisit(currencyQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
        it('should return the correct sql with currency filter predicates for gt operator', () => {
            const predicate = `gt: 123.45`;
            const result = transform(parseAndVisit(currencyQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
        it('should return the correct sql with currency filter predicates for gte operator', () => {
            const predicate = `gte: 123.45`;
            const result = transform(parseAndVisit(currencyQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
        it('should return the correct sql with currency filter predicates for lt operator', () => {
            const predicate = `lt: 123.45`;
            const result = transform(parseAndVisit(currencyQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
        it('should return the correct sql with currency filter predicates for lte operator', () => {
            const predicate = `lte: 123.45`;
            const result = transform(parseAndVisit(currencyQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
        it('should return the correct sql with currency filter predicates for in operator', () => {
            const predicate = `in: [123.45]`;
            const result = transform(parseAndVisit(currencyQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
        it('should return the correct sql with currency filter predicates for nin operator', () => {
            const predicate = `nin: [123.45]`;
            const result = transform(parseAndVisit(currencyQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
    });

    describe('multipicklist', () => {
        const multipicklistQuery = (predicate) => {
            return /* GraphQL */ `
                query multipicklistPredicate {
                    uiapi {
                        query {
                            ServiceTerritory(where: { Birds__c: { ${predicate} } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Birds__c {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `;
        };

        it('should return the correct sql with multipicklist filter predicates for eq operator', () => {
            const predicate = `eq: "Albatross;Parrot"`;
            const result = transform(parseAndVisit(multipicklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });

        it('should return the correct sql with multipicklist filter predicates for ne operator', () => {
            const predicate = `ne: "Albatross;Parrot"`;
            const result = transform(parseAndVisit(multipicklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });

        it('should return the correct sql with multipicklist filter predicates for includes operator', () => {
            const predicate = `includes: ["Albatross;Parrot"]`;
            const result = transform(parseAndVisit(multipicklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });

        it('should return the correct sql with multipicklist filter predicates for includes operator with multiple terms', () => {
            const predicate = `includes: ["Albatross;Parrot", "Macaw"]`;
            const result = transform(parseAndVisit(multipicklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });

        it('should return the correct sql with multipicklist filter predicates for excludes operator', () => {
            const predicate = `excludes: ["Albatross;Parrot"]`;
            const result = transform(parseAndVisit(multipicklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });

        it('should return the correct sql with multipicklist filter predicates for excludes operator with multiple terms', () => {
            const predicate = `excludes: ["Albatross;Parrot", "Macaw"]`;
            const result = transform(parseAndVisit(multipicklistQuery(predicate)), parserInput);
            expect(sql(unwrappedValue(result), sqlMappingInput)).toMatchSnapshot();
        });
    });
});
