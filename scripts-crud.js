const COLLECTION_NAME = 'mapperMembers';

function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebaseReady && window.db) {
      resolve();
    } else {
      setTimeout(() => waitForFirebase().then(resolve), 100);
    }
  });
}

async function getMembers() {
  await waitForFirebase();
  try {
    const snapshot = await window.db.collection(COLLECTION_NAME).get();
    const members = [];
    snapshot.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });
    return members;
  } catch (err) {
    console.error('Erro ao carregar membros:', err);
    return [];
  }
}

async function addMember(member) {
  await waitForFirebase();
  try {
    const members = await getMembers();
    const exists = members.some(m => 
      m.nick.toLowerCase() === member.nick.toLowerCase() && m.rg === member.rg
    );
    if (exists) return false;

    member.registered = new Date().toLocaleString();
    await window.db.collection(COLLECTION_NAME).add(member);
    return true;
  } catch (err) {
    console.error('Erro ao adicionar membro:', err);
    return false;
  }
}

async function removeMember(nick, rg) {
  await waitForFirebase();
  try {
    const snapshot = await window.db.collection(COLLECTION_NAME)
      .where('nick', '==', nick)
      .where('rg', '==', rg)
      .get();
    
    if (snapshot.empty) return false;

    const batch = window.db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao remover membro:', err);
    return false;
  }
}

async function updateMemberRole(nick, rg, role, level, by) {
  await waitForFirebase();
  try {
    const snapshot = await window.db.collection(COLLECTION_NAME)
      .where('nick', '==', nick)
      .where('rg', '==', rg)
      .get();
    
    if (snapshot.empty) return false;

    const updateData = {
      role: role,
      level: level,
      by: by,
      registered: new Date().toLocaleString()
    };

    const batch = window.db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, updateData);
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao atualizar role:', err);
    return false;
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

  form.addEventListener('submit', async function (event) {
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
      const success = await addMember({ level: levelCatalog, levelExp, nick, rg, role, discord, numero, idade, orgCorp, by });
      message.textContent = success ? `✓ ${nick} cadastrado com sucesso!` : '✗ Membro já existe (mesmo NICK + RG).';
      message.style.color = success ? '#a7f3d0' : '#f87171';
      if (success) {
        setTimeout(() => {
          window.history.back();
        }, 1500);
      }
    } else if (action === 'remove') {
      const success = await removeMember(nick, rg);
      message.textContent = success ? `✓ ${nick} removido com sucesso!` : '✗ Membro não encontrado.';
      message.style.color = success ? '#a7f3d0' : '#f87171';
    } else if (action === 'promote' || action === 'demote') {
      const success = await updateMemberRole(nick, rg, role, levelCatalog, by);
      message.textContent = success ? `✓ ${nick} agora é ${role}!` : '✗ Membro não encontrado.';
      message.style.color = success ? '#a7f3d0' : '#f87171';
    }
  });
})();
