// Admin Dashboard Scripts

const STORAGE_KEY = 'mapperMembers';

const roleHierarchy = {
  'Aprendiz Mapper': 1,
  'Mapper': 2,
  'Auxiliar Mapper': 3,
  'Responsável Mapper': 4
};

function getMembers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

function saveMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function removeAllMembers() {
  localStorage.removeItem(STORAGE_KEY);
  return true;
}

function removeMembersBelowRole(maxRoleHierarchy) {
  const members = getMembers();
  const filtered = members.filter(m => roleHierarchy[m.role] > maxRoleHierarchy);
  saveMembers(filtered);
  return true;
}

// Auxiliar Dashboard
const btnRemoveAllAux = document.getElementById('btnRemoveAllAux');
if (btnRemoveAllAux) {
  btnRemoveAllAux.addEventListener('click', () => {
    if (confirm('Deseja remover todos os Aprendizes? Esta ação não pode ser desfeita.')) {
      removeMembersBelowRole(1); // Remove apenas cargos com hierarchy <= 1 (Aprendiz)
      alert('Aprendizes removidos com sucesso!');
      setTimeout(() => window.location.href = 'auxiliar.html', 500);
    }
  });
}

// Responsável Dashboard
const btnRemoveAllResp = document.getElementById('btnRemoveAllResp');
if (btnRemoveAllResp) {
  btnRemoveAllResp.addEventListener('click', () => {
    if (confirm('Deseja remover todos os membros? Esta ação não pode ser desfeita.')) {
      removeAllMembers();
      alert('Todos os membros foram removidos com sucesso!');
      setTimeout(() => window.location.href = 'index.html', 500);
    }
  });
}

// Relatório de Membros
function gerarRelatorio() {
  const members = getMembers();
  const cargosPermitidos = ['Aprendiz Mapper', 'Mapper', 'Auxiliar Mapper'];
  const membrosFiltrados = members.filter(m => cargosPermitidos.includes(m.role));

  let relatorio = 'SETOR MAPPER\n\n';

  membrosFiltrados.forEach((m, index) => {
    relatorio += `NICK: ${m.nick}\nRG: ${m.rg}\nCARGO: ${m.role}\nIDADE: ${m.idade || 'N/A'}\nLEVEL: ${m.level || 'N/A'}\nORG/CORP: ${m.orgCorp || 'N/A'}\nNÚMERO: ${m.numero || 'N/A'}\nDISCORD: ${m.discord || 'N/A'}\n`;
    if (index < membrosFiltrados.length - 1) {
      relatorio += '\n---\n\n';
    }
  });

  return relatorio;
}

const btnRelatorio = document.getElementById('btnRelatorio');
const relatorioModal = document.getElementById('relatorioModal');
const relatorioContent = document.getElementById('relatorioContent');
const btnFecharRelatorio = document.getElementById('btnFecharRelatorio');
const btnCopiarRelatorio = document.getElementById('btnCopiarRelatorio');
const btnFecharRelatorioBtn = document.getElementById('btnFecharRelatorioBtn');

if (btnRelatorio) {
  btnRelatorio.addEventListener('click', () => {
    const relatorio = gerarRelatorio();
    relatorioContent.value = relatorio;
    relatorioModal.classList.remove('hidden');
  });
}

if (btnFecharRelatorio) {
  btnFecharRelatorio.addEventListener('click', () => {
    relatorioModal.classList.add('hidden');
  });
}

if (btnCopiarRelatorio) {
  btnCopiarRelatorio.addEventListener('click', () => {
    relatorioContent.select();
    document.execCommand('copy');
    alert('Relatório copiado para a área de transferência!');
  });
}

if (btnFecharRelatorioBtn) {
  btnFecharRelatorioBtn.addEventListener('click', () => {
    relatorioModal.classList.add('hidden');
  });
}
