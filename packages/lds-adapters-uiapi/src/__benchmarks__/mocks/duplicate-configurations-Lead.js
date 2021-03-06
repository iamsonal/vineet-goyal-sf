export default `{
  "apiName": "Lead",
  "dedupeEnabled": true,
  "dedupeFields": [
    "City",
    "Company",
    "Email",
    "FirstName",
    "LastName",
    "Phone",
    "PostalCode",
    "Street",
    "Title"
  ],
  "duplicateRules": [
    {
      "actionOnInsert": "Allow",
      "actionOnUpdate": "Allow",
      "active": true,
      "duplicateRuleFilters": [],
      "eTag": "a65fb08fee8f1dd0119af6a937b12e81",
      "matchRules": [
        {
          "eTag": "e5f853a4946a05839d4e91154feaa8b4",
          "matchEngine": "FuzzyMatchEngine",
          "matchFields": [
            "City",
            "Company",
            "Email",
            "FirstName",
            "LastName",
            "Phone",
            "PostalCode",
            "Street",
            "Title"
          ],
          "name": "Standard Lead Matching Rule v1.0",
          "objectApiName": "Lead"
        },
        {
          "eTag": "a8f726a446aec263e944ab76b186bdc8",
          "matchEngine": "FuzzyMatchEngine",
          "matchFields": [
            "City",
            "Company",
            "Email",
            "FirstName",
            "LastName",
            "Phone",
            "PostalCode",
            "Street",
            "Title"
          ],
          "name": "Standard Contact Matching Rule v1.1",
          "objectApiName": "Contact"
        }
      ],
      "name": "Standard_Lead_Duplicate_Rule",
      "operationsOnInsert": ["Alert", "Report"],
      "operationsOnUpdate": ["Report"]
    }
  ],
  "eTag": "23e76c2ee4b1a341d1f6d82fded78759",
  "predupeEnabled": true
}
`;
