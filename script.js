const LS_USERS = 'probinder_users_vfinal';
const LS_CUR = 'probinder_current_vfinal';

let users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
let current = localStorage.getItem(LS_CUR) || null;
let currentAlbum = null;
let currentPageIndex = 0;

document.addEventListener('DOMContentLoaded', ()=>{
  if(current && users[current]){
    showApp();
    loadProfileToUI();
    populateAlbums();
  } else {
    showAuth();
  }
});

function showAuth(){ document.getElementById('auth').classList.remove('hidden'); document.getElementById('app').classList.add('hidden'); }
function showApp(){ document.getElementById('auth').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); }

function openModal(html){
  const modal = document.getElementById('modal');
  modal.innerHTML = '<div class="modal"><div class="mcard">'+html+'</div></div>';
  modal.classList.remove('hidden');
  modal.onclick = (e)=>{ if(e.target === modal) closeModal(); };
}
function closeModal(){ const m=document.getElementById('modal'); m.innerHTML=''; m.classList.add('hidden'); }

function showSignup(){
  openModal(`<h3>Criar perfil</h3>
    <div class="form-row">
      <input id="su_name" placeholder="Nome completo" type="text"/>
      <input id="su_nick" placeholder="@nickname (sem @)" type="text"/>
      <input id="su_pass" placeholder="Senha" type="password"/>
      <label class="small">Foto de perfil</label>
      <input id="su_avatar" type="file" accept="image/*"/>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btn ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn" onclick="createProfile()">Criar</button>
    </div>`);
}

function showLogin(){
  openModal(`<h3>Entrar</h3>
    <div class="form-row">
      <input id="li_nick" placeholder="@nickname (sem @)" type="text"/>
      <input id="li_pass" placeholder="Senha" type="password"/>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btn ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn" onclick="login()">Entrar</button>
    </div>`);
}

function createProfile(){
  const name = document.getElementById('su_name').value.trim();
  const nick = document.getElementById('su_nick').value.trim();
  const pass = document.getElementById('su_pass').value;
  const file = document.getElementById('su_avatar').files[0];
  if(!name || !nick || !pass) return alert('Preencha todos os campos!');
  const key = '@'+nick;
  if(users[key]) return alert('Esse nickname já existe!');
  const user = { name, nick, pass, avatar:'', albums:{} , theme:'azul' };
  function finishCreate(){
    user.albums['Meu Álbum'] = [ createEmptyPage(1) ];
    users[key] = user;
    saveAll();
    current = key; localStorage.setItem(LS_CUR, current);
    closeModal(); showApp(); loadProfileToUI(); populateAlbums();
  }
  if(file){
    const reader = new FileReader();
    reader.onload = ()=>{ user.avatar = reader.result; finishCreate(); };
    reader.readAsDataURL(file);
  } else finishCreate();
}

function login(){
  const nick = document.getElementById('li_nick').value.trim();
  const pass = document.getElementById('li_pass').value;
  const key = '@'+nick;
  if(!users[key]) return alert('Usuário não encontrado');
  if(users[key].pass !== pass) return alert('Senha incorreta');
  current = key; localStorage.setItem(LS_CUR, current);
  closeModal(); showApp(); loadProfileToUI(); populateAlbums();
}

function logout(){
  if(confirm('Deseja sair?')){
    current = null; localStorage.removeItem(LS_CUR); showAuth();
  }
}

function saveAll(){ localStorage.setItem(LS_USERS, JSON.stringify(users)); }

function loadProfileToUI(){
  const u = users[current];
  document.getElementById('briefAvatar').src = u.avatar || '';
  document.getElementById('briefNick').textContent = '@'+u.nick;
  setTheme(u.theme || 'azul');
}

function populateAlbums(){
  const select = document.getElementById('albumSelect');
  select.innerHTML = '';
  const u = users[current];
  Object.keys(u.albums).forEach(name => {
    const opt = document.createElement('option'); opt.value = name; opt.textContent = name; select.appendChild(opt);
  });
  currentAlbum = Object.keys(u.albums)[0];
  renderTabsAndPage();
}

function createAlbumPrompt(){
  const name = prompt('Nome do novo álbum');
  if(!name) return;
  const u = users[current];
  if(u.albums[name]) return alert('Já existe um álbum com esse nome');
  u.albums[name] = [ createEmptyPage(1) ];
  saveAll(); populateAlbums();
}

function selectAlbum(name){ currentAlbum = name; renderTabsAndPage(); }

function createEmptyPage(num){ return { number:num, cards: Array.from({length:9}, ()=>({name:'', img:''})) }; }

function renderTabsAndPage(){
  const tabs = document.getElementById('tabs'); tabs.innerHTML='';
  const pages = users[current].albums[currentAlbum];
  pages.forEach((p, idx)=>{
    const tab = document.createElement('div'); tab.className='tab'+(idx===0?' active':'');
    tab.textContent = 'Folha ' + p.number;
    tab.onclick = ()=>{ document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); tab.classList.add('active'); renderPage(idx); };
    tabs.appendChild(tab);
  });
  renderPage(0);
}

function addPage(){
  const u = users[current]; const pages = u.albums[currentAlbum];
  const nextNum = pages.length + 1;
  pages.push(createEmptyPage(nextNum));
  saveAll(); renderTabsAndPage();
}

function renderPage(idx){
  currentPageIndex = idx;
  const container = document.getElementById('pagesContainer'); container.innerHTML='';
  const pageObj = users[current].albums[currentAlbum][idx];
  const pageDiv = document.createElement('div'); pageDiv.className='page';
  const grid = document.createElement('div'); grid.className='grid';
  pageObj.cards.forEach((card, ci)=>{
    const c = document.createElement('div'); c.className='card';
    const img = document.createElement('img'); img.src = card.img || ''; img.alt='';
    img.onclick = ()=>{ uploadFor(card, img); };
    const file = document.createElement('input'); file.type='file'; file.accept='image/*'; file.onchange = (e)=>{
      const f = e.target.files[0]; const reader = new FileReader(); reader.onload = ()=>{ card.img = reader.result; users[current].albums[currentAlbum][idx].cards[ci].img = card.img; saveAll(); renderPage(idx); }; reader.readAsDataURL(f);
    };
    const nameIn = document.createElement('input'); nameIn.type='text'; nameIn.placeholder='Nome do card'; nameIn.value = card.name || '';
    nameIn.oninput = ()=>{ users[current].albums[currentAlbum][idx].cards[ci].name = nameIn.value; saveAll(); };
    c.appendChild(img); c.appendChild(file); c.appendChild(nameIn); grid.appendChild(c);
  });
  pageDiv.appendChild(grid); container.appendChild(pageDiv);
}

function uploadFor(cardObj, imgEl){
  const input = document.createElement('input'); input.type='file'; input.accept='image/*';
  input.onchange = e => { const f = e.target.files[0]; const r = new FileReader(); r.onload = ()=>{ cardObj.img = r.result; saveAll(); renderPage(currentPageIndex); }; r.readAsDataURL(f); };
  input.click();
}

function setTheme(t){
  document.body.classList.remove('theme-azul','theme-verde','theme-lilas');
  document.body.classList.add('theme-'+t);
  if(current){ users[current].theme = t; saveAll(); }
}

function openProfileModal(){
  if(!current) return alert('Faça login ou crie perfil primeiro');
  const u = users[current];
  openModal(`<h3>Perfil</h3>
    <div style="display:flex;gap:8px;align-items:center">
      <img src="${u.avatar||''}" style="width:64px;height:64px;border-radius:8px;object-fit:cover">
      <div><div style="font-weight:700">${u.name}</div><div class="small">@${u.nick}</div></div>
    </div>
    <div class="form-row">
      <input id="ed_name" value="${u.name}" type="text"/>
      <input id="ed_pass" placeholder="Nova senha (deixe em branco para manter)" type="password"/>
      <label class="small">Alterar foto</label>
      <input id="ed_avatar" type="file" accept="image/*"/>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btn ghost" onclick="closeModal()">Fechar</button>
      <button class="btn" onclick="saveProfileEdits()">Salvar</button>
    </div>`);
}

function saveProfileEdits(){
  const u = users[current];
  const name = document.getElementById('ed_name').value.trim();
  const pass = document.getElementById('ed_pass').value;
  const file = document.getElementById('ed_avatar').files[0];
  if(!name) return alert('Nome não pode ficar vazio');
  function finishSave(data){
    if(data) u.avatar = data;
    u.name = name;
    if(pass) u.pass = pass;
    users[current] = u; saveAll(); closeModal(); loadProfileToUI();
  }
  if(file){
    const r = new FileReader(); r.onload = ()=> finishSave(r.result); r.readAsDataURL(file);
  } else finishSave();
}
