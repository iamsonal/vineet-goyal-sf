### ADAPTER NAME

API Family: _API FAMILY_

HTTP Method: _HTTP METHOD_

#### Description

ADAPTER DESCRIPTION

> Below is a checklist to help guarantee that your adapter meets testing and functional standards. There are also generate questions designed to assess your overall API health. Every checkbox will need to be checked before merge. If a checkbox cannot be checked, please include specific details to justify why there needs to be an exception.

#### Overall

- [ ] Implementation (including tests) is complete.
- [ ] Adapter is 100% Code Generated

#### API

- [ ] I understand that any future changes in API behavior will need to be reflected in this adapter. Those future changes will be handled by the team that created the adapter.
- [ ] API will not make breaking changes across versions
- [ ] No data overlaps with existing wire adapters

#### Integration Tests

- [ ] Basic Cache Miss Scenario
- [ ] Basic Cache Hit Scenario
- [ ] Expired Data Cache Miss Scenario
- [ ] Data refreshes correctly
- [ ] Server 404 Emits Correctly to Component
- [ ] Server 404 Cache Hit Scenario
- [ ] Expired Server 404 Cache Miss Scenario
