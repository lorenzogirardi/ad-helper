'use strict';

const path = require('path');
const express = require('express');
const { withClient } = require('./ldapClient');
const { searchUsers, getUser, searchGroups, getGroup } = require('./adQueries');
const { sendCSV, sendJSON } = require('./export');

const app = express();
const PORT = process.env.PORT || 3000;
const AD_BASE_DN = process.env.AD_BASE_DN;

app.use(express.static(path.join(__dirname, '..', 'public')));

function requireQuery(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) {
    res.status(400).json({ error: 'Missing query parameter "q"' });
    return null;
  }
  return q;
}

function handleError(res, err) {
  console.error(err);
  res.status(502).json({ error: 'LDAP query failed', detail: err.message });
}

// --- Users ---

app.get('/api/users/search', async (req, res) => {
  const q = requireQuery(req, res);
  if (q === null) return;
  try {
    const result = await withClient((client) => searchUsers(client, AD_BASE_DN, q));
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/users/search.csv', async (req, res) => {
  const q = requireQuery(req, res);
  if (q === null) return;
  try {
    const { users } = await withClient((client) => searchUsers(client, AD_BASE_DN, q));
    sendCSV(res, 'users.csv', users);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/users/search.json', async (req, res) => {
  const q = requireQuery(req, res);
  if (q === null) return;
  try {
    const { users } = await withClient((client) => searchUsers(client, AD_BASE_DN, q));
    sendJSON(res, 'users.json', users);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/users/:dn', async (req, res) => {
  const dn = decodeURIComponent(req.params.dn);
  try {
    const user = await withClient((client) => getUser(client, dn));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
});

// --- Groups ---

app.get('/api/groups/search', async (req, res) => {
  const q = requireQuery(req, res);
  if (q === null) return;
  try {
    const result = await withClient((client) => searchGroups(client, AD_BASE_DN, q));
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/groups/search.csv', async (req, res) => {
  const q = requireQuery(req, res);
  if (q === null) return;
  try {
    const { groups } = await withClient((client) => searchGroups(client, AD_BASE_DN, q));
    sendCSV(res, 'groups.csv', groups);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/groups/search.json', async (req, res) => {
  const q = requireQuery(req, res);
  if (q === null) return;
  try {
    const { groups } = await withClient((client) => searchGroups(client, AD_BASE_DN, q));
    sendJSON(res, 'groups.json', groups);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/groups/:dn', async (req, res) => {
  const dn = decodeURIComponent(req.params.dn);
  try {
    const group = await withClient((client) => getGroup(client, AD_BASE_DN, dn));
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/groups/:dn/members.csv', async (req, res) => {
  const dn = decodeURIComponent(req.params.dn);
  try {
    const group = await withClient((client) => getGroup(client, AD_BASE_DN, dn));
    if (!group) return res.status(404).json({ error: 'Group not found' });
    sendCSV(res, `${group.cn || 'group'}-members.csv`, group.members);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/groups/:dn/members.json', async (req, res) => {
  const dn = decodeURIComponent(req.params.dn);
  try {
    const group = await withClient((client) => getGroup(client, AD_BASE_DN, dn));
    if (!group) return res.status(404).json({ error: 'Group not found' });
    sendJSON(res, `${group.cn || 'group'}-members.json`, group.members);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`AD Helper listening on port ${PORT}`);
});
