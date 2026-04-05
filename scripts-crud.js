const COLLECTION_NAME = 'mapperMembers';

function waitForDB() {
  return new Promise((resolve) => {
    console.log('⏳ waitForDB - Aguardando Supabase...');
    console.log('   dbReady?', window.dbReady);
    console.log('   supabase?', !!window.supabase);
    
    if (window.dbReady && window.supabase) {
      console.log('✅ waitForDB - Supabase JÁ está pronto!');
      resolve();
    } else {
      console.log('⌛ waitForDB - Aguardando evento dbReady...');
      window.addEventListener('dbReady', () => {
        console.log('✅ waitForDB - Evento dbReady recebido!');
        resolve();
      }, { once: true });
    }
  });
}

async function getMembers() {
  await waitForDB();
  console.log('📥 getMembers - Buscando membros do Supabase...');
  try {
    const { data, error } = await window.supabase
      .from(TABLE_NAME)
      .select('*');
    
    if (error) throw error;
    
    console.log('📊 getMembers - Total de registros encontrados:', data.length);
    const members = data.map(item => ({ id: item.id, ...item }));
    console.log('✅ getMembers - Total de membros carregados:', members.length);
    return members;
  } catch (err) {
    console.error('❌ getMembers - Erro ao carregar:', err);
    console.error('   Mensagem:', err.message);
    return [];
  }
}

async function addMember(member) {
  console.log('🔄 addMember - Iniciando adição');
  console.log('   Objeto recebido:', member);
  console.log('   Campos do objeto:');
  Object.keys(member).forEach(key => {
    console.log(`     - ${key}: "${member[key]}" (tipo: ${typeof member[key]})`);
  });
  
  await waitForDB();
  try {
    console.log('📡 addMember - Supabase está pronto, buscando membros existentes...');
    const members = await getMembers();
    console.log('📋 addMember - Total de membros atuais:', members.length);
    
    const exists = members.some(m => 
      m.nick.toLowerCase() === member.nick.toLowerCase() && m.rg === member.rg
    );
    
    if (exists) {
      console.warn('⚠️ addMember - Membro DUPLICADO detectado:', member.nick, '/', member.rg);
      return false;
    }

    // Adiciona a data/hora de registro
    member.registered = new Date().toLocaleString();
    
    console.log('💾 addMember - Preparando para salvar no Supabase...');
    console.log('   Data de registro:', member.registered);
    console.log('   Objeto final antes de salvar:', member);
    
    const { data, error } = await window.supabase
      .from(TABLE_NAME)
      .insert([member])
      .select();
    
    if (error) throw error;
    
    console.log('✅ addMember - SALVO COM SUCESSO!');
    console.log('   Dados confirmados:', data);

    // Cache será atualizado pelo polling no index.html
    console.log('   Cache será atualizado pelo polling');
    
    return true;
  } catch (err) {
    console.error('❌ addMember - ERRO AO ADICIONAR!');
    console.error('   Mensagem:', err.message);
    console.error('   Código de erro:', err.code);
    console.error('   Detalhes completos:', err);
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
    console.log('=== FORM SUBMIT COMEÇOU ===');
    console.log('Action:', action, '| Context:', context);

    // Captura todos os campos do formulário
    const nick = document.getElementById('fieldNick')?.value?.trim() || '';
    const rg = document.getElementById('fieldRg')?.value?.trim() || '';
    const levelEl = document.getElementById('fieldLevel');
    const level = levelEl ? parseInt(levelEl.value, 10) || 0 : 0;
    const levelExp = level;
    const levelCatalogEl = document.getElementById('fieldLevelCatalog');
    const levelCatalog = levelCatalogEl ? parseInt(levelCatalogEl.value, 10) || 1 : 1;
    const orgCorpEl = document.getElementById('fieldOrgCorp');
    const orgCorp = orgCorpEl ? orgCorpEl.value : 'Independente';
    const roleEl = document.getElementById('fieldRole');
    const role = roleEl ? roleEl.value : '';
    const discordEl = document.getElementById('fieldDiscord');
    const discord = discordEl ? discordEl.value.trim() : '';
    const numeroEl = document.getElementById('fieldNumero');
    const numero = numeroEl ? numeroEl.value.trim() : '';
    const idadeEl = document.getElementById('fieldIdade');
    const idade = idadeEl ? parseInt(idadeEl.value, 10) || 0 : 0;
    const byEl = document.getElementById('fieldBy');
    const by = byEl ? byEl.value.trim() : 'Sistema';

    console.log('📋 CAMPOS CAPTURADOS:');
    console.log('  nick:', nick);
    console.log('  rg:', rg);
    console.log('  level:', level);
    console.log('  levelExp:', levelExp);
    console.log('  levelCatalog:', levelCatalog);
    console.log('  orgCorp:', orgCorp);
    console.log('  role:', role);
    console.log('  discord:', discord);
    console.log('  numero:', numero);
    console.log('  idade:', idade);
    console.log('  by:', by);

    if (action === 'add') {
      console.log('=== INICIANDO ADIÇÃO ===');
      
      const memberData = { 
        level: levelCatalog, 
        levelExp, 
        nick, 
        rg, 
        role, 
        discord, 
        numero, 
        idade, 
        orgCorp, 
        by 
      };
      
      console.log('📦 OBJETO COMPLETO A ENVIAR:', memberData);
      
      const success = await addMember(memberData);
      
      console.log('=== RESULTADO DA ADIÇÃO ===');
      console.log('Sucesso?', success);
      
      message.textContent = success ? `✓ ${nick} cadastrado com sucesso!` : '✗ Membro já existe (mesmo NICK + RG).';
      message.style.color = success ? '#a7f3d0' : '#f87171';
      
      if (success) {
        console.log('🎉 Sucesso! Redirecionando em 1.5s...');
        console.log('📍 Novo membro:', nick, 'com RG:', rg, 'e role:', role);
        
        // Mostrar alerta visual antes de redirecionar
        alert(`✅ ${nick} foi adicionado com sucesso!\n\nVocê será redirecionado para a página inicial.`);
        
        setTimeout(() => {
          if (context === 'add_member' || context === 'add_resp' || context === 'add_aux') {
            console.log('Redirecionando para index.html');
            window.location.href = 'index.html';
          } else {
            window.history.back();
          }
        }, 1500);
      } else {
        console.error('❌ Falha ao adicionar membro');
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
