# Open questions

Single registry.

| ID | Priority | Status | Question | Evidence / answer | Residual and proof needed | Unit |
|---|---|---|---|---|---|---|
| Q-OU-EXT | medium | PARTIAL | Do contractor accounts (`-ext`) have a different OU/structure than standard person accounts? | Tested: account `user-example-ext@example.internal` has a standard OU, same structure, no contractor-specific OU observed | No test on other organizational units to confirm a uniform pattern | architecture, flows |
| Q-TLS | low | EXTERNAL | Does a production deploy require LDAPS with certificate validation instead of plain LDAP? | The MVP uses plain `ldap://`, `AD_DISABLE_TLS_CHECK` exists only as a test flag | IT/security decision outside the perimeter of this documentation | operations |
| Q-CACHE | low | EXTERNAL | Is a cache (Redis or in-memory) needed for frequent searches? | The current design is stateless by choice (data consistency), no performance problem observed with 140 members | Needs real usage data (query frequency, concurrent users) not available now | operations |
| Q-FOREST | low | OPEN | Does the app support multi-forest/multi-base-DN AD? | The code reads a single `AD_BASE_DN` from env, no multi-base support observed in `adQueries.js`/`server.js` | No customer request for multi-forest so far | structure, architecture |
| Q-RANGE-LARGE | low | OPEN | `rangedSearch` was tested only on a group with 140 members (below the 1500 threshold of a single range). Is the behaviour correct also on groups with more than 1500 members and several real ranges? | The code implements a generic loop, the logic was read and is consistent with the official AD documentation, but no group with more than 1500 members is available in the test environment for direct verification | A real group with more than 1500 members is needed for an end-to-end test of the multi-range loop | architecture, flows |

Statuses: OPEN, PARTIAL, EXTERNAL, CLOSED. Keep IDs and rationale; update copies with a link to the ID. A configuration datum does not automatically close a runtime question.
