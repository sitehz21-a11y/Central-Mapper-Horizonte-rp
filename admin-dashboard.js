// Admin Dashboard Scripts

const COLLECTION_NAME = 'mapperMembers';

const roleHierarchy = {
  'Aprendiz Mapper': 1,
  'Mapper': 2,
  'Auxiliar Mapper': 3,
  'Responsável Mapper': 4
};

function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebaseReady && window.db) {
      resolve();
    } else {
      window.addEventListener('firebaseReady', () => resolve(), { once: true });
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

async function removeAllMembers() {
  await waitForFirebase();
  try {
    const snapshot = await window.db.collection(COLLECTION_NAME).get();
    const batch = window.db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao remover todos:', err);
    return false;
  }
}

async function removeMembersBelowRole(maxRoleHierarchy) {
  await waitForFirebase();
  try {
    let delete_query;
    const members = await getMembers();
    
    const membersToDelete = members.filter(m => roleHierarchy[m.role] <= maxRoleHierarchy);
    
    const batch = window.db.batch();
    membersToDelete.forEach(member => {
      const ref = window.db.collection(COLLECTION_NAME).doc(member.id);
      batch.delete(ref);
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Erro ao remover membros abaixo da role:', err);
    return false;
  }
}

// Auxiliar Dashboard
const btnRemoveAllAux = document.getElementById('btnRemoveAllAux');
if (btnRemoveAllAux) {
  btnRemoveAllAux.addEventListener('click', async () => {
    if (confirm('Deseja remover todos os Aprendizes? Esta ação não pode ser desfeita.')) {
      await removeMembersBelowRole(1); // Remove apenas cargos com hierarchy <= 1 (Aprendiz)
      alert('Aprendizes removidos com sucesso!');
      setTimeout(() => window.location.href = 'auxiliar.html', 500);
    }
  });
}

// Responsável Dashboard
const btnRemoveAllResp = document.getElementById('btnRemoveAllResp');
if (btnRemoveAllResp) {
  btnRemoveAllResp.addEventListener('click', async () => {
    if (confirm('Deseja remover todos os membros? Esta ação não pode ser desfeita.')) {
      await removeAllMembers();
      alert('Todos os membros foram removidos com sucesso!');
      setTimeout(() => window.location.href = 'index.html', 500);
    }
  });
}

// Relatório de Membros
async function gerarRelatorio() {
  const members = await getMembers();
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
  btnRelatorio.addEventListener('click', async () => {
    const relatorio = await gerarRelatorio();
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
