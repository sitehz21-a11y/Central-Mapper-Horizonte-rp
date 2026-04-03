const STORAGE_KEY = 'mapperMembers';

function getMembers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(err);
    return [];
  }
}

function saveMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function addMember(member) {
  const members = getMembers();
  const exists = members.some(m => m.nick.toLowerCase() === member.nick.toLowerCase() && m.rg === member.rg);
  if (exists) return false;
  member.registered = new Date().toLocaleString();
  members.push(member);
  saveMembers(members);
  return true;
}

function removeMember(nick, rg) {
  const members = getMembers();
  const index = members.findIndex(m => m.nick.toLowerCase() === nick.toLowerCase() && m.rg === rg);
  if (index < 0) return false;
  members.splice(index, 1);
  saveMembers(members);
  return true;
}

function updateMemberRole(nick, rg, role, level, by) {
  const members = getMembers();
  const member = members.find(m => m.nick.toLowerCase() === nick.toLowerCase() && m.rg === rg);
  if (!member) return false;
  member.role = role;
  member.level = level;
  member.by = by;
  member.registered = new Date().toLocaleString();
  saveMembers(members);
  return true;
}

(function init() {
  const form = document.getElementById('crudForm');
  if (!form) return;

  const action = form.dataset.action;
  const context = form.dataset.context;
  const message = document.getElementById('crudMessage');

  if (context === 'remove_member') {
    const levelLabel = document.querySelector('label:has(#fieldLevel)');
    if (levelLabel) levelLabel.style.display = 'none';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const nick = document.getElementById('fieldNick').value.trim();
    const rg = document.getElementById('fieldRg').value.trim();
    const levelEl = document.getElementById('fieldLevel');
    const level = levelEl ? parseInt(levelEl.value, 10) || 0 : 0;
    const levelExp = level;
    const levelCatalogEl = document.getElementById('fieldLevelCatalog');
    const levelCatalog = levelCatalogEl ? parseInt(levelCatalogEl.value, 10) : 1;
    const orgCorpEl = document.getElementById('fieldOrgCorp');
    const orgCorp = orgCorpEl ? orgCorpEl.value : 'Independente';
    const roleEl = document.getElementById('fieldRole');
    const role = roleEl ? roleEl.value : '';
    const discordEl = document.getElementById('fieldDiscord');
    const discord = discordEl ? discordEl.value.trim() : '';
    const numeroEl = document.getElementById('fieldNumero');
    const numero = numeroEl ? numeroEl.value.trim() : '';
    const idadeEl = document.getElementById('fieldIdade');
    const idade = idadeEl ? parseInt(idadeEl.value, 10) : 0;
    const byEl = document.getElementById('fieldBy');
    const by = byEl ? byEl.value.trim() : 'Sistema';

    if (action === 'add') {
      const success = addMember({ level: levelCatalog, levelExp, nick, rg, role, discord, numero, idade, orgCorp, by });
      message.textContent = success ? `✓ ${nick} cadastrado com sucesso!` : '✗ Membro já existe (mesmo NICK + RG).';
      message.style.color = success ? '#a7f3d0' : '#f87171';
      if (success) {
        setTimeout(() => {
          window.history.back();
        }, 1500);
      }
    } else if (action === 'remove') {
      const success = removeMember(nick, rg);
      message.textContent = success ? `✓ ${nick} removido com sucesso!` : '✗ Membro não encontrado.';
      message.style.color = success ? '#a7f3d0' : '#f87171';
    } else if (action === 'promote' || action === 'demote') {
      const success = updateMemberRole(nick, rg, role, levelCatalog, by);
      message.textContent = success ? `✓ ${nick} agora é ${role}!` : '✗ Membro não encontrado.';
      message.style.color = success ? '#a7f3d0' : '#f87171';
    }
  });
})();
