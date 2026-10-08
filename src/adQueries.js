'use strict';

const { search, rangedSearch } = require('./ldapClient');

// AD userAccountControl bit 2 (0x2) = ACCOUNTDISABLE
function isAccountDisabled(uac) {
  const n = parseInt(uac, 10);
  return !Number.isNaN(n) && (n & 0x2) !== 0;
}

// Extracts a human path from a DN's OU= segments, root-first.
// e.g. "CN=Lorenzo Girardi,OU=Contractors,OU=IT,DC=emea,..." -> "IT > Contractors"
function parseOU(dn) {
  if (!dn) return '';
  const parts = dn.split(',').map((p) => p.trim());
  const ous = parts.filter((p) => p.toUpperCase().startsWith('OU=')).map((p) => p.slice(3));
  return ous.reverse().join(' > ');
}

// Extracts the CN value from a DN, same idea as the user's `sed 's/.*CN=\([^,]*\).*/\1/'`
function cnFromDN(dn) {
  if (!dn) return '';
  const match = dn.match(/CN=([^,]*)/i);
  return match ? match[1] : dn;
}

function escapeLDAPFilterValue(value) {
  return String(value)
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\0/g, '\\00');
}

async function searchUsers(client, baseDN, q) {
  const v = escapeLDAPFilterValue(q);
  const filter = `(&(objectClass=user)(objectCategory=person)(|(sAMAccountName=*${v}*)(cn=*${v}*)(mail=*${v}*)(displayName=*${v}*)))`;
  const { entries, truncated } = await search(client, baseDN, filter, [
    'dn',
    'sAMAccountName',
    'displayName',
    'mail',
    'userAccountControl',
  ]);

  const users = entries.map((e) => ({
    dn: e.dn,
    sAMAccountName: e.sAMAccountName || '',
    displayName: e.displayName || '',
    mail: e.mail || '',
    ou: parseOU(e.dn),
    disabled: isAccountDisabled(e.userAccountControl),
  }));

  return { users, truncated };
}

async function getUser(client, dn) {
  const { entries } = await search(client, dn, '(objectClass=user)', [
    'dn',
    'sAMAccountName',
    'displayName',
    'givenName',
    'sn',
    'mail',
    'telephoneNumber',
    'title',
    'department',
    'company',
    'userAccountControl',
    'whenCreated',
    'memberOf',
    'primaryGroupID',
    'objectSid',
  ]);

  if (entries.length === 0) return null;
  const e = entries[0];
  const memberOf = e.memberOf ? (Array.isArray(e.memberOf) ? e.memberOf : [e.memberOf]) : [];

  // primary group is not in memberOf: its SID is the user's SID with the last
  // sub-authority (RID) replaced by primaryGroupID.
  if (e.primaryGroupID && e.objectSid) {
    const groupSid = e.objectSid.replace(/-\d+$/, `-${parseInt(e.primaryGroupID, 10)}`);
    const { entries: pg } = await search(client, process.env.AD_BASE_DN, `(&(objectClass=group)(objectSid=${groupSid}))`, ['dn']);
    if (pg.length > 0 && !memberOf.includes(pg[0].dn)) memberOf.push(pg[0].dn);
  }

  return {
    dn: e.dn,
    sAMAccountName: e.sAMAccountName || '',
    displayName: e.displayName || '',
    givenName: e.givenName || '',
    sn: e.sn || '',
    mail: e.mail || '',
    telephoneNumber: e.telephoneNumber || '',
    title: e.title || '',
    department: e.department || '',
    company: e.company || '',
    disabled: isAccountDisabled(e.userAccountControl),
    whenCreated: e.whenCreated || '',
    ou: parseOU(e.dn),
    groups: memberOf.map((gdn) => ({ cn: cnFromDN(gdn), dn: gdn })),
  };
}

async function searchGroups(client, baseDN, q) {
  const v = escapeLDAPFilterValue(q);
  const filter = `(&(objectClass=group)(cn=*${v}*))`;
  const { entries, truncated } = await search(client, baseDN, filter, ['dn', 'cn', 'description']);

  const groups = entries.map((e) => ({
    dn: e.dn,
    cn: e.cn || '',
    description: e.description || '',
    ou: parseOU(e.dn),
  }));

  return { groups, truncated };
}

// Resolves mail/sAMAccountName/displayName for a batch of user DNs in as few
// LDAP round-trips as possible: one query per chunk with an OR filter on
// distinguishedName, instead of one query per member.
async function resolveUserDetails(client, baseDN, dns) {
  const details = new Map();
  if (dns.length === 0) return details;

  const CHUNK = 200;
  for (let i = 0; i < dns.length; i += CHUNK) {
    const chunk = dns.slice(i, i + CHUNK);
    const orFilter = chunk.map((dn) => `(distinguishedName=${escapeLDAPFilterValue(dn)})`).join('');
    const filter = `(&(objectClass=user)(|${orFilter}))`;
    const { entries } = await search(client, baseDN, filter, [
      'dn',
      'sAMAccountName',
      'displayName',
      'mail',
      'userAccountControl',
    ]);
    for (const e of entries) {
      details.set(e.dn.toLowerCase(), {
        sAMAccountName: e.sAMAccountName || '',
        displayName: e.displayName || '',
        mail: e.mail || '',
        disabled: isAccountDisabled(e.userAccountControl),
      });
    }
  }
  return details;
}

async function primaryGroupMembers(client, baseDN, rid) {
  const { entries } = await search(client, baseDN, `(&(objectCategory=person)(primaryGroupID=${parseInt(rid, 10)}))`, ['dn']);
  return entries.map((x) => x.dn);
}

async function getGroup(client, baseDN, dn) {
  const { entries } = await search(client, dn, '(objectClass=group)', ['dn', 'cn', 'description', 'primaryGroupToken']);
  if (entries.length === 0) return null;
  const e = entries[0];

  const memberDNs = await rangedSearch(client, dn, 'member');

  // Users whose *primary* group is this one (e.g. Domain Users, RID 513) are NOT
  // listed in `member`: AD only stores them via their primaryGroupID attribute.
  const primaryDNs = e.primaryGroupToken ? await primaryGroupMembers(client, baseDN, e.primaryGroupToken) : [];
  const seen = new Set(memberDNs.map((d) => d.toLowerCase()));
  for (const pdn of primaryDNs) {
    if (!seen.has(pdn.toLowerCase())) memberDNs.push(pdn);
  }

  const details = await resolveUserDetails(client, baseDN, memberDNs);

  const members = memberDNs.map((mdn) => {
    const info = details.get(mdn.toLowerCase());
    return {
      cn: cnFromDN(mdn),
      dn: mdn,
      sAMAccountName: info ? info.sAMAccountName : '',
      displayName: info ? info.displayName : '',
      mail: info ? info.mail : '',
      disabled: info ? info.disabled : null, // null = unresolved (e.g. nested group, not a user)
    };
  });

  return {
    dn: e.dn,
    cn: e.cn || '',
    description: e.description || '',
    ou: parseOU(e.dn),
    members,
  };
}

module.exports = { searchUsers, getUser, searchGroups, getGroup, parseOU, cnFromDN };
