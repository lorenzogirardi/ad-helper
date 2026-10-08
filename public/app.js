'use strict';

// --- Tabs ---

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

// --- Users ---

const userForm = document.getElementById('user-search-form');
const userInput = document.getElementById('user-search-input');
const userTable = document.getElementById('user-results-table');
const userTbody = userTable.querySelector('tbody');
const userActions = document.getElementById('user-results-actions');
const userTruncatedWarning = document.getElementById('user-truncated-warning');
const userDetail = document.getElementById('user-detail');

userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = userInput.value.trim();
  if (!q) return;

  userDetail.classList.add('hidden');
  const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Errore ricerca utenti');
    return;
  }

  renderUserResults(data.users, data.truncated);
  userActions.classList.remove('hidden');
  document.getElementById('user-export-csv').href = `/api/users/search.csv?q=${encodeURIComponent(q)}`;
  document.getElementById('user-export-json').href = `/api/users/search.json?q=${encodeURIComponent(q)}`;
});

function renderUserResults(users, truncated) {
  userTruncatedWarning.classList.toggle('hidden', !truncated);
  userTbody.innerHTML = '';
  users.forEach((u) => {
    const tr = document.createElement('tr');
    const userDisplay = u.mail ? `${escapeHTML(u.displayName)}<br><small style="color: var(--text-dim);">${escapeHTML(u.mail)}</small>` : escapeHTML(u.displayName);
    tr.innerHTML = `
      <td>${userDisplay}</td>
      <td>${escapeHTML(u.ou)}</td>
      <td class="${u.disabled ? 'badge-disabled' : 'badge-enabled'}">${u.disabled ? 'Disabilitato' : 'Attivo'}</td>
    `;
    tr.addEventListener('click', () => loadUserDetail(u.dn));
    userTbody.appendChild(tr);
  });
  userTable.classList.toggle('hidden', users.length === 0);
}

async function loadUserDetail(dn) {
  const res = await fetch(`/api/users/${encodeURIComponent(dn)}`);
  const u = await res.json();
  if (!res.ok) {
    alert(u.error || 'Errore caricamento utente');
    return;
  }

  const groupChips = u.groups
    .map((g) => `<span class="chip" data-dn="${escapeHTML(g.dn)}">${escapeHTML(g.cn)}</span>`)
    .join('') || '<span class="section-title">Nessun gruppo</span>';

  userDetail.innerHTML = `
    <h2>${escapeHTML(u.displayName)} ${u.disabled ? '<span class="badge-disabled">(disabilitato)</span>' : ''}</h2>
    <dl class="detail-grid">
      <dt>sAMAccountName</dt><dd>${escapeHTML(u.sAMAccountName)}</dd>
      <dt>Email</dt><dd>${escapeHTML(u.mail)}</dd>
      <dt>Telefono</dt><dd>${escapeHTML(u.telephoneNumber)}</dd>
      <dt>Titolo</dt><dd>${escapeHTML(u.title)}</dd>
      <dt>Dipartimento</dt><dd>${escapeHTML(u.department)}</dd>
      <dt>Azienda</dt><dd>${escapeHTML(u.company)}</dd>
      <dt>OU</dt><dd>${escapeHTML(u.ou)}</dd>
      <dt>Creato il</dt><dd>${escapeHTML(u.whenCreated)}</dd>
      <dt>DN</dt><dd style="word-break: break-all;">${escapeHTML(u.dn)}</dd>
    </dl>
    <div class="section-title">Membro di (${u.groups.length})</div>
    <div class="chip-list">${groupChips}</div>
  `;
  userDetail.classList.remove('hidden');

  userDetail.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelector('[data-tab="groups"]').click();
      loadGroupDetail(chip.dataset.dn);
    });
  });
}

// --- Groups ---

const groupForm = document.getElementById('group-search-form');
const groupInput = document.getElementById('group-search-input');
const groupTable = document.getElementById('group-results-table');
const groupTbody = groupTable.querySelector('tbody');
const groupActions = document.getElementById('group-results-actions');
const groupTruncatedWarning = document.getElementById('group-truncated-warning');
const groupDetail = document.getElementById('group-detail');

groupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = groupInput.value.trim();
  if (!q) return;

  groupDetail.classList.add('hidden');
  const res = await fetch(`/api/groups/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Errore ricerca gruppi');
    return;
  }

  renderGroupResults(data.groups, data.truncated);
  groupActions.classList.remove('hidden');
  document.getElementById('group-export-csv').href = `/api/groups/search.csv?q=${encodeURIComponent(q)}`;
  document.getElementById('group-export-json').href = `/api/groups/search.json?q=${encodeURIComponent(q)}`;
});

function renderGroupResults(groups, truncated) {
  groupTruncatedWarning.classList.toggle('hidden', !truncated);
  groupTbody.innerHTML = '';
  groups.forEach((g) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(g.cn)}</td>
      <td>${escapeHTML(g.description)}</td>
      <td>${escapeHTML(g.ou)}</td>
    `;
    tr.addEventListener('click', () => loadGroupDetail(g.dn));
    groupTbody.appendChild(tr);
  });
  groupTable.classList.toggle('hidden', groups.length === 0);
}

async function loadGroupDetail(dn) {
  const res = await fetch(`/api/groups/${encodeURIComponent(dn)}`);
  const g = await res.json();
  if (!res.ok) {
    alert(g.error || 'Errore caricamento gruppo');
    return;
  }

  const memberRows = g.members
    .map(
      (m) => `
    <tr data-dn="${escapeHTML(m.dn)}">
      <td>${escapeHTML(m.cn)}</td>
      <td>${escapeHTML(m.mail)}</td>
    </tr>
  `
    )
    .join('');

  groupDetail.innerHTML = `
    <h2>${escapeHTML(g.cn)}</h2>
    <dl class="detail-grid">
      <dt>Descrizione</dt><dd>${escapeHTML(g.description)}</dd>
      <dt>OU</dt><dd>${escapeHTML(g.ou)}</dd>
      <dt>DN</dt><dd style="word-break: break-all;">${escapeHTML(g.dn)}</dd>
    </dl>
    <div class="section-title">Membri (${g.members.length})</div>
    <div class="results-actions" style="margin-bottom: 12px;">
      <a href="/api/groups/${encodeURIComponent(g.dn)}/members.csv" target="_blank">Esporta CSV</a>
      <a href="/api/groups/${encodeURIComponent(g.dn)}/members.json" target="_blank">Esporta JSON</a>
    </div>
    ${
      g.members.length > 0
        ? `<table class="results-table" style="margin-top: 12px;">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          ${memberRows}
        </tbody>
      </table>`
        : '<p style="color: var(--text-dim);">Nessun membro</p>'
    }
  `;
  groupDetail.classList.remove('hidden');

  groupDetail.querySelectorAll('tbody tr').forEach((row) => {
    row.addEventListener('click', () => {
      document.querySelector('[data-tab="users"]').click();
      loadUserDetail(row.dataset.dn);
    });
  });
}
