const COLLECTION_NAME = 'mapperMembers';
let membersCache = [];

// Aguardar Firebase ficar pronto
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
  console.log('Firebase ready, loading members...');
  try {
    const snapshot = await window.db.collection(COLLECTION_NAME).get();
    const members = [];
    snapshot.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });
    membersCache = members;
    console.log('Members loaded from Firestore:', members);
    return members;
  } catch (err) {
    console.error('Erro ao carregar membros:', err);
    return [];
  }
}

async function addMember(member) {
  await waitForFirebase();
  try {
    const exists = membersCache.some(m =>
      m.nick.toLowerCase() === member.nick.toLowerCase() && m.rg === member.rg
    );
    if (exists) return false;

    member.registered = new Date().toLocaleString();
    const docRef = await window.db.collection(COLLECTION_NAME).add(member);
    membersCache.push({ id: docRef.id, ...member });
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

    membersCache = membersCache.filter(m => !(m.nick === nick && m.rg === rg));
    return true;
  } catch (err) {
    console.error('Erro ao remover membro:', err);
    return false;
  }
}

async function removeAllMembers() {
  await waitForFirebase();
  try {
    const snapshot = await window.db.collection(COLLECTION_NAME).get();
    const batch = window.db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    membersCache = [];
    return true;
  } catch (err) {
    console.error('Erro ao remover todos:', err);
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
      levelExp: level,
      by: by,
      registered: new Date().toLocaleString()
    };

    const batch = window.db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, updateData);
    });
    await batch.commit();

    membersCache = membersCache.map(m =>
      (m.nick === nick && m.rg === rg) ? { ...m, ...updateData } : m
    );
    return true;
  } catch (err) {
    console.error('Erro ao atualizar role:', err);
    return false;
  }
}

async function renderIndex() {
  const members = await getMembers();
  const tableBody = document.getElementById('membersTableBody');
  const totalMembers = document.getElementById('totalMembers');
  const totalResp = document.getElementById('totalResp');
  const totalAux = document.getElementById('totalAux');
  const totalMapper = document.getElementById('totalMapper');
  const filters = document.querySelectorAll('.cat-btn');

  let activeFilter = 'all';

  function render() {
    console.log('Rendering members, activeFilter:', activeFilter, 'members:', members);
    tableBody.innerHTML = '';
    let filtered = members.filter(m => activeFilter === 'all' || m.role === activeFilter);
    filtered = sortMembersByHierarchy(filtered);

    if (filtered.length === 0) {
      if (members.length === 0) {
        // Nenhum membro cadastrado
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #93c5fd; padding: 2rem;">Nenhum membro cadastrado no setor<br><small style="color: #64748b; font-size: 0.8rem;">Adicione membros usando os botões de administração</small></td></tr>';
      } else {
        // Filtro ativo mas nenhum resultado
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #93c5fd; padding: 2rem;">Nenhum membro encontrado para este filtro</td></tr>';
      }
    } else {
      filtered.forEach(m => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
          <td>${m.level}%</td>
          <td class="nick-col">${m.nick}</td>
          <td>${m.rg}</td>
          <td class="role-cell">${m.role}</td>
          <td>${m.by}</td>
          <td>${m.registered}</td>
        `;
        row.addEventListener('click', () => showDetail(m));
        tableBody.appendChild(row);
      });
    }

    totalMembers.textContent = members.length;
    totalResp.textContent = members.filter(m => m.role === 'Responsável Mapper').length;
    totalAux.textContent = members.filter(m => m.role === 'Auxiliar Mapper').length;
    totalMapper.textContent = members.filter(m => m.role === 'Mapper' || m.role === 'Aprendiz Mapper').length;
  }

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      filters.forEach(el => el.classList.toggle('active', el === btn));
      render();
    });
  });

  render();
}

const roleHierarchy = {
  'Aprendiz Mapper': 1,
  'Mapper': 2,
  'Auxiliar Mapper': 3,
  'Responsável Mapper': 4
};

function sortMembersByHierarchy(members) {
  return [...members].sort((a, b) => {
    const hierarchyA = roleHierarchy[a.role] || 0;
    const hierarchyB = roleHierarchy[b.role] || 0;
    return hierarchyA - hierarchyB;
  });
}

function showDetail(member) {
  const detailContent = document.getElementById('detailContent');

  const isRestricted = member.role === 'Responsável Mapper' || member.role === 'Auxiliar Mapper';
  const roleClass = member.role === 'Responsável Mapper' ? '' : `role-${member.role.toLowerCase().replace(/\s+/g, '-')}`;

  let extraInfo = '';
  if (!isRestricted) {
    extraInfo = `
      <p><strong>Número:</strong> ${member.numero}</p>
      <p><strong>Idade:</strong> ${member.idade} anos</p>
      <p><strong>Org/Corp:</strong> ${member.orgCorp || 'N/A'}</p>
    `;
  }

  detailContent.innerHTML = `
    <div class="detail-row">
      <p><strong>NICK:</strong> ${member.nick}</p>
      <p><strong>RG:</strong> ${member.rg}</p>
      <p><strong>Discord:</strong> ${member.discord}</p>
      ${!isRestricted ? `<p><strong>Número:</strong> ${member.numero}</p>` : ''}
    </div>
    <div class="detail-row">
      <p><strong>Cargo:</strong> <span class="role-badge ${roleClass}">${member.role}</span></p>
      <p><strong>Level:</strong> ${member.level || 'N/A'}</p>
      ${!isRestricted ? `<p><strong>Idade:</strong> ${member.idade} anos</p>` : ''}
      ${!isRestricted ? `<p><strong>Org/Corp:</strong> ${member.orgCorp || 'N/A'}</p>` : ''}
    </div>
    <div class="detail-row">
      <p><strong>Nível de Experiência:</strong></p>
      <div class="level-bar">
        <div class="level-fill" style="width: ${member.levelExp || member.level}%"></div>
        <span class="level-percent">${member.levelExp || member.level}%</span>
      </div>
    </div>
    <div class="detail-row">
      <p><strong>Registrado por:</strong> ${member.by}</p>
      <p><strong>Data/Hora:</strong> ${member.registered}</p>
    </div>
  `;

  document.getElementById('detailPanel').classList.remove('hidden');
}

function handleLoginModal() {
  const btnLoginTop = document.getElementById('btnLoginTop');
  const loginModal = document.getElementById('loginModal');
  const loginModalClose = document.getElementById('loginModalClose');
  const adminSubmitBtn = document.getElementById('adminSubmitBtn');
  const adminPassword = document.getElementById('adminPassword');
  const loginMsg = document.getElementById('loginMsg');

  btnLoginTop.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });

  loginModalClose.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    adminPassword.value = '';
    loginMsg.textContent = '';
  });

  adminSubmitBtn.addEventListener('click', () => {
    const pass = adminPassword.value.trim();

    if (pass === 'cria') {
      sessionStorage.setItem('mapperAdminRole', 'Auxiliar');
      window.location.href = 'auxiliar.html';
    } else if (pass === 'criarp') {
      sessionStorage.setItem('mapperAdminRole', 'Responsável');
      window.location.href = 'responsavel.html';
    } else {
      loginMsg.textContent = 'Senha inválida';
      loginMsg.style.color = '#f87171';
    }
  });

  document.getElementById('detailClose').addEventListener('click', () => {
    document.getElementById('detailPanel').classList.add('hidden');
  });
}

function handleNavButtons() {
  const scrollToTopBtn = document.getElementById('scrollToTop');
  const scrollToBottomBtn = document.getElementById('scrollToBottom');

  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (scrollToBottomBtn) {
    scrollToBottomBtn.addEventListener('click', () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }
}

(function init() {
  // Aguardar DOM estar completamente carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  async function initApp() {
    const path = window.location.pathname.split('/').pop();

    if (path === 'index.html' || path === '') {
      // Pequeno delay para garantir que todos os elementos estejam disponíveis
      setTimeout(async () => {
        console.log('Initializing renderIndex...');
        await renderIndex();
        handleLoginModal();
        handleNavButtons();
      }, 100);
    }
  }
})();
