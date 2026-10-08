# Setup and operations

## Tutorial: first start

### 1. Clone/setup the project

```bash
cd ad-helper
cp .env.example .env
```

### 2. Fill in `.env`

Required:
- `AD_URL`: protocol + hostname, e.g. `ldap://ad.example.internal`
- `AD_BASE_DN`: search base, e.g. `DC=ad,DC=example,DC=internal`
- `AD_BIND_DN`: bind account username, e.g. `jdoe@ad.example.internal` or `CN=SERVICE_ACCOUNT_DN,OU=Service Accounts,DC=ad,DC=example,DC=internal`
- `AD_BIND_PASSWORD`: bind account password (gitignored)

Optional:
- `PORT`: port Node listens on inside the container, default 3000 (Compose maps it to host `127.0.0.1:3080`, it does not override it)
- `AD_DISABLE_TLS_CHECK`: `true` for tests with LDAPS on non-prod (skip cert validation)
- `AD_BIND_PASSWORD_FILE`: `/run/secrets/...` if you use Docker secrets (otherwise fall back to the env var)

Example `.env`:
```
AD_URL=ldap://ad.example.internal
AD_BASE_DN=DC=ad,DC=example,DC=internal
AD_BIND_DN=jdoe@ad.example.internal
AD_BIND_PASSWORD=REPLACE_WITH_SECRET
PORT=3000
```

Do not know the base DN? The rootDSE can be read anonymously:
```bash
ldapsearch -x -LLL -H ldap://ad.example.internal -s base -b "" defaultNamingContext
```

### 3. Build and start

```bash
docker compose up -d --build
```

Check that the container is running:
```bash
docker ps | grep ad-helper
```

Check health:
```bash
curl http://localhost:3080/api/health
```

Expected: `{"status":"ok"}`

## How-to: troubleshooting

### Cannot connect to AD / bind failure

**Error:** `502 LDAP query failed: ... error_name: InvalidCredentialsError`

**Causes:** wrong AD_BIND_DN or AD_BIND_PASSWORD, or locked account.

**Fix:**
- Check the AD_BIND_DN syntax (full DN or sAMAccountName@domain depending on the AD config)
- Check that the account password has not expired
- Local test: `ldapsearch -x -H "AD_URL" -D "AD_BIND_DN" -W -b "AD_BASE_DN" "cn=*" 2>&1` to debug

### Connection timeout / refused

**Error:** `502 Error: getaddrinfo ENOTFOUND ...` or `connectRefused: connect ECONNREFUSED ...`

**Causes:** AD_URL not reachable (hostname, firewall, DNS, VPN).

**Fix:**
- Test DNS: `nslookup ad.example.internal` / `ping -c 1 ad.example.internal`
- Test the LDAP port: `nc -zv ad.example.internal 389`
- Check the outbound firewall on port 389
- Make sure Docker Desktop can reach the network (try `docker run --rm alpine nc -vz -w 3 <host> 389`)

### Search returns 0 results

**Expected:** searching "jane" returns users with jane in sAMAccountName/cn/displayName/mail

**If empty:**
- Check AD_BASE_DN: `ldapsearch -x -H ldap://AD_URL -D "AD_BIND_DN" -W -b "DC=x,DC=y" "cn=*" dn | head`
- Check the filters: `objectClass=user`, `objectCategory=person` exclude machine accounts, they do not exclude `-ext`

### A group shows no members, or a user shows no groups

If it is a primary group (typically `Domain Users`), see rule R6 in [Flows](../03-flows/README.md): AD does not store it in `member`/`memberOf`. Make sure you are running a version that includes the primary group handling.

### `.env` changed but nothing happens

Compose reads `env_file` only when the container is created. `docker compose restart` is not enough, use:
```bash
docker compose up -d --force-recreate
```

### Docker compose port 3080 in use

**Error:** `Error response from daemon: ... address already in use`

**Fix:** change the host port in docker-compose.yml, e.g. `127.0.0.1:3081:3000` (keep the container port `3000` unchanged)

### JSON export appears empty / CSV works

**Root cause (FIXED):** `Content-Disposition: attachment` on JSON -> silent browser download, it looked empty.

**Fix:** the `.json` endpoint removes the attachment header, shown inline in the browser.

## How-to: monitoring

### Container running check
```bash
docker compose ps
```

### Logs
```bash
docker compose logs -f ad-helper
```

### Performance check: batch resolution timing

Searching a group with 140 members should complete in <2s (1 range retrieval + 1 batch query).

A `curl` to `/api/groups/{dn}` includes the group with resolved members.

## Reference: deployment notes

**Security:**
- Bind host `127.0.0.1` only (Compose), do not expose unless behind an external VPN
- `.env` never in git
- The bind account is a normal read-only domain user (no modify permission)
- No TLS cert validation in the MVP (tests only); LDAPS + cert validation for production is a decision to confirm (see Q-TLS in open-questions.md), not a requirement already implemented

**Scalability:**
- Stateless: no session, no cache -> scale horizontally with a load balancer
- Each query hits LDAP fresh (no cache, design choice for consistency)
- Batch resolution chunk size 200 (tunable in adQueries.js if needed)
- LDAP timeout: 15s per operation, 10s per connection (`src/ldapClient.js`)

Unimplemented evolutions (cache, LDAPS, multi-forest): see [open questions](../_meta/open-questions.md). Rate limiting and audit log are backlog ideas not yet tracked with a formal question.

## How-to: update and rebuild

After a code change:
```bash
docker compose up -d --build
```

After a config (`.env`) change only:
```bash
docker compose up -d --force-recreate
```

After a new npm dependency:
```bash
npm install  # or npm install --package-lock-only if a dependency was added
docker compose up -d --build
```
