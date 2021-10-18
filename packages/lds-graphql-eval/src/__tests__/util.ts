export function makeGraphQL(where: string, edges: string = 'Id'): string {
    return /* GraphQL */ `
    query {
        uiapi {
            query {
                TimeSheet(where: ${where})
                    @connection {
                    edges {
                        node @resource(type: "Record") {
                            ${edges}
                        }
                    }
                }
            }
        }
    }
`;
}
