The service is multi-tenant. Every request is authenticated by middleware that sets
`req.user = { id, orgId }`. Users must only see records belonging to their own org.

`db.raw` executes a SQL string with no parameter binding. `db('table')` is a query
builder that binds parameters.

The `users` table has roughly 4 million rows. `orgs` has roughly 20 thousand.
