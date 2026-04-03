const STORAGE_KEY = 'mapperMembers';

const defaultMembers = [];

// Verificar se localStorage está disponível
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Fallback para quando localStorage não está disponível
let memoryStorage = {};

function getStorageItem(key) {
  if (isLocalStorageAvailable()) {
    return localStorage.getItem(key);
  }
  return memoryStorage[key] || null;
}

function setStorageItem(key, value) {
  if (isLocalStorageAvailable()) {
    localStorage.setItem(key, value);
  } else {
    memoryStorage[key] = value;
  }
}

function getMembers() {
  const raw = getStorageItem(STORAGE_KEY);
  if (!raw) {
    saveMembers(defaultMembers);
    return [...defaultMembers];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao parsear dados do localStorage:', err);
    return [...defaultMembers];
  }
}

function saveMembers(members) {
  setStorageItem(STORAGE_KEY, JSON.stringify(members));
}

function sortMembersByHierarchy(members) {
  return [...members].sort((a, b) => {
    const hierarchyA = roleHierarchy[a.role] || 0;
    const hierarchyB = roleHierarchy[b.role] || 0;
    return hierarchyA - hierarchyB;
  });
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

function removeAllMembers() {
  saveMembers([]);
  return true;
}

function removeMembersBelowRole(maxRole) {
  const members = getMembers();
  const filtered = members.filter(m => roleHierarchy[m.role] > maxRole);
  saveMembers(filtered);
  return true;
}

function updateMemberRole(nick, rg, role, level, by) {
  const members = getMembers();
  const member = members.find(m => m.nick.toLowerCase() === nick.toLowerCase() && m.rg === rg);
  if (!member) return false;
  member.role = role;
  member.level = level;
  member.levelExp = level;
  member.by = by;
  member.registered = new Date().toLocaleString();
  saveMembers(members);
  return true;
}

function renderIndex() {
  const members = getMembers();
  const tableBody = document.getElementById('membersTableBody');
  const totalMembers = document.getElementById('totalMembers');
  const totalResp = document.getElementById('totalResp');
  const totalAux = document.getElementById('totalAux');
  const totalMapper = document.getElementById('totalMapper');
  const filters = document.querySelectorAll('.cat-btn');

  let activeFilter = 'all';

function renderIndex() {
  const members = getMembers();
  const tableBody = document.getElementById('membersTableBody');
  const totalMembers = document.getElementById('totalMembers');
  const totalResp = document.getElementById('totalResp');
  const totalAux = document.getElementById('totalAux');
  const totalMapper = document.getElementById('totalMapper');
  const filters = document.querySelectorAll('.cat-btn');

  let activeFilter = 'all';

  function render() {
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

  function initApp() {
    const path = window.location.pathname.split('/').pop();

    if (path === 'index.html' || path === '') {
      // Pequeno delay para garantir que todos os elementos estejam disponíveis
      setTimeout(() => {
        renderIndex();
        handleLoginModal();
        handleNavButtons();
      }, 100);
    }
  }
})();


function getMembers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveMembers(defaultMembers);
    return [...defaultMembers];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(err);
    return [...defaultMembers];
  }
}

function saveMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function findMember(nick, rg) {
  const members = getMembers();
  return members.find(m => m.nick.toLowerCase() === nick.toLowerCase() && m.rg === rg);
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

function addMember(member) {
  const members = getMembers();
  const exists = members.some(m => m.nick.toLowerCase() === member.nick.toLowerCase() && m.rg === member.rg);
  if (exists) return false;
  member.registered = new Date().toLocaleString();
  members.push(member);
  saveMembers(members);
  return true;
}

function handleLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const msg = document.getElementById('loginMessage');

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const role = document.getElementById('adminRole').value;
    const pass = document.getElementById('adminPassword').value.trim();

    if ((role === 'Auxiliar' && pass === 'cria') || (role === 'Responsável' && pass === 'criarp')) {
      sessionStorage.setItem('mapperAdminRole', role);
      window.location.href = 'admin.html';
    } else {
      msg.textContent = 'Senha inválida para a função selecionada.';
      msg.style.color = '#f87171';
    }
  });
}

function handleAdminPage() {
  const role = sessionStorage.getItem('mapperAdminRole');
  const status = document.getElementById('adminStatus');
  if (!role) {
    status.textContent = 'Acesso não autorizado. Faça login em login.html.';
    status.style.color = '#f87171';
    return;
  }
  status.textContent = `Acesso garantido como ${role}.`;
  status.style.color = '#a7f3d0';
}

function setupCrudForm() {
  const form = document.getElementById('crudForm');
  if (!form) return;
  const action = form.dataset.action;
  const context = form.dataset.context;
  const message = document.getElementById('crudMessage');

  const sessionRole = sessionStorage.getItem('mapperAdminRole');
  const fieldBy = document.getElementById('fieldBy');
  if (fieldBy) {
    if (sessionRole === 'Auxiliar') fieldBy.value = 'Auxiliar Mapper';
    else if (sessionRole === 'Responsável') fieldBy.value = 'Responsável Mapper';
    else if (!fieldBy.value) fieldBy.value = 'Sistema';
  }

  if (context === 'add_aux') {
    document.getElementById('fieldRole').value = 'Auxiliar Mapper';
  }

  if (context === 'add_resp') {
    document.getElementById('fieldRole').value = 'Responsável Mapper';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const nick = document.getElementById('fieldNick').value.trim();
    const rg = document.getElementById('fieldRg').value.trim();
    const level = parseInt(document.getElementById('fieldLevel').value, 10) || 1;
    const role = document.getElementById('fieldRole').value;
    const by = document.getElementById('fieldBy').value.trim() || 'Sistema';
    const discord = document.getElementById('fieldDiscord') ? document.getElementById('fieldDiscord').value.trim() : '';
    const numero = document.getElementById('fieldNumero') ? document.getElementById('fieldNumero').value.trim() : '';
    const idade = document.getElementById('fieldIdade') ? parseInt(document.getElementById('fieldIdade').value, 10) : 0;
    const orgCorp = document.getElementById('fieldOrgCorp') ? document.getElementById('fieldOrgCorp').value : 'Independente';

    if (action === 'add') {
      const success = addMember({
        nick,
        rg,
        role,
        level,
        levelExp: level,
        discord,
        numero,
        idade,
        orgCorp,
        by
      });
      message.textContent = success ? `Membro adicionado com sucesso: ${nick}` : 'Membro já existe (mesmo NICK + RG).';
      message.style.color = success ? '#a7f3d0' : '#f87171';
    } else if (action === 'remove') {
      const success = removeMember(nick, rg);
      message.textContent = success ? `Membro removido: ${nick}` : 'Membro não encontrado.';
      message.style.color = success ? '#a7f3d0' : '#f87171';
    } else if (action === 'promote' || action === 'demote') {
      const success = updateMemberRole(nick, rg, role, level, by);
      message.textContent = success ? `Cargo atualizado para: ${role}` : 'Membro não encontrado para promoção/rebaixamento.';
      message.style.color = success ? '#a7f3d0' : '#f87171';
    }
  });
}
