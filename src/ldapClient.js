'use strict';

const ldap = require('ldapjs');
const fs = require('fs');

function readSecret(envVar) {
  const fileVar = `${envVar}_FILE`;
  if (process.env[fileVar]) {
    return fs.readFileSync(process.env[fileVar], 'utf8').trim();
  }
  return process.env[envVar];
}

function getConfig() {
  const url = process.env.AD_URL;
  const baseDN = process.env.AD_BASE_DN;
  const bindDN = readSecret('AD_BIND_DN');
  const bindPassword = readSecret('AD_BIND_PASSWORD');

  if (!url || !baseDN || !bindDN || !bindPassword) {
    throw new Error(
      'Missing AD config. Required env vars: AD_URL, AD_BASE_DN, AD_BIND_DN, AD_BIND_PASSWORD (or AD_BIND_PASSWORD_FILE).'
    );
  }
  return { url, baseDN, bindDN, bindPassword };
}

// Runs fn(client) against a fresh bound LDAP client, always unbinding after.
async function withClient(fn) {
  const { url, bindDN, bindPassword } = getConfig();
  const client = ldap.createClient({
    url,
    reconnect: false,
    timeout: 15000,
    connectTimeout: 10000,
    tlsOptions: process.env.AD_DISABLE_TLS_CHECK === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  client.on('error', () => {
    // swallow async socket errors after we're done; bind()/search() below handle the request-scoped ones
  });

  try {
    await new Promise((resolve, reject) => {
      client.bind(bindDN, bindPassword, (err) => (err ? reject(err) : resolve()));
    });
    return await fn(client);
  } finally {
    client.unbind(() => {});
  }
}

// Runs a single LDAP search, collects entries into an array.
// Returns { entries, truncated }.
function search(client, base, filter, attributes) {
  return new Promise((resolve, reject) => {
    const entries = [];
    let truncated = false;

    client.search(
      base,
      { filter, attributes, scope: 'sub', paged: false },
      (err, res) => {
        if (err) return reject(err);

        res.on('searchEntry', (entry) => {
          const plain = entry.pojo ? pojoToPlain(entry.pojo) : entry.object;
          // pojo values are utf8-decoded strings: binary attrs need the raw buffer
          const sid = (entry.attributes || []).find((a) => a.type === 'objectSid');
          if (sid && sid.buffers && sid.buffers[0]) plain.objectSid = sidToString(sid.buffers[0]);
          entries.push(plain);
        });
        res.on('searchReference', () => {});
        res.on('error', (err2) => {
          if (err2 instanceof ldap.SizeLimitExceededError || err2.name === 'SizeLimitExceededError') {
            truncated = true;
            resolve({ entries, truncated });
          } else {
            reject(err2);
          }
        });
        res.on('end', () => resolve({ entries, truncated }));
      }
    );
  });
}

// ldapjs v3 returns entry.pojo = { objectName, attributes: [{type, values}] }
function pojoToPlain(pojo) {
  const obj = { dn: pojo.objectName };
  for (const attr of pojo.attributes) {
    obj[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
  }
  return obj;
}

// Binary objectSid -> "S-1-5-21-..." (string form is accepted by AD in filters)
function sidToString(buf) {
  const rev = buf[0];
  const count = buf[1];
  const authority = buf.readUIntBE(2, 6);
  const subs = [];
  for (let i = 0; i < count; i++) subs.push(buf.readUInt32LE(8 + i * 4));
  return `S-${rev}-${authority}-${subs.join('-')}`;
}

// AD splits large multivalued attributes (e.g. `member` on big groups) into
// ranged chunks: member;range=0-1499, member;range=1500-2999, ... ;range=N-*
// This loops fetching each chunk until the final (unbounded) range comes back.
async function rangedSearch(client, dn, attrName) {
  let all = [];
  let start = 0;
  const pageSize = 1000;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rangeAttr = `${attrName};range=${start}-${start + pageSize - 1}`;
    const { entries } = await search(client, dn, '(objectClass=*)', [rangeAttr, `${attrName};range=${start}-*`, attrName]);
    if (entries.length === 0) break;
    const entry = entries[0];

    // find whichever range key actually came back
    const key = Object.keys(entry).find((k) => k.startsWith(`${attrName};range=`));
    if (key) {
      const values = Array.isArray(entry[key]) ? entry[key] : [entry[key]];
      all = all.concat(values);
      if (key.endsWith('-*')) break; // final chunk
      start += pageSize;
    } else if (entry[attrName]) {
      // attribute small enough to come back unranged
      all = Array.isArray(entry[attrName]) ? entry[attrName] : [entry[attrName]];
      break;
    } else {
      break; // no such attribute at all
    }
  }
  return all;
}

module.exports = { withClient, search, rangedSearch };
