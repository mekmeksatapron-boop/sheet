// --- Simple util ---
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

const App = {
  state: {
    cfg: { backend:'', folderId:'', sheetId:'' },
    sets: [],
    queue: JSON.parse(localStorage.getItem('queue')||'[]')
  },

  show(tab){
    const map = {create:'view-create', sets:'view-sets', settings:'view-settings'};
    qsa('.tab').forEach(el=>el.classList.remove('active'));
    qsa('nav.bottom button').forEach(el=>el.classList.remove('active'));

    if(tab==='create'){ qs('#tab-create').classList.add('active'); qs('#nav-create').classList.add('active'); }
    if(tab==='sets'){ qs('#tab-sets').classList.add('active'); qs('#nav-sets').classList.add('active'); this.refreshSets(); }
    if(tab==='settings'){ qs('#tab-settings').classList.add('active'); qs('#nav-settings').classList.add('active'); this.loadConfigToUI(); }

    ['view-create','view-sets','view-settings'].forEach(id=>qs('#'+id).classList.add('hidden'));
    qs('#'+map[tab]).classList.remove('hidden');
    this.updateStatusBar();
  },

  toast(msg){
    const el = qs('#toast'); el.textContent = msg; el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'), 1500);
  },

  loadConfig(){
    try{ this.state.cfg = JSON.parse(localStorage.getItem('cfg')||'{}'); }catch{}
    this.state.cfg.backend ??= ''; this.state.cfg.folderId ??= ''; this.state.cfg.sheetId ??= '';
  },
  loadConfigToUI(){
    this.loadConfig();
    qs('#cfg-backend').value = this.state.cfg.backend;
    qs('#cfg-folder').value = this.state.cfg.folderId;
    qs('#cfg-sheet').value = this.state.cfg.sheetId;
  },
  saveConfig(){
    const backend = qs('#cfg-backend').value.trim();
    const folderId = qs('#cfg-folder').value.trim();
    const sheetId = qs('#cfg-sheet').value.trim();
    localStorage.setItem('cfg', JSON.stringify({backend, folderId, sheetId}));
    this.toast('บันทึกการตั้งค่าแล้ว');
    this.updateStatusBar();
  },
  seedDemo(){
    qs('#cfg-backend').value = 'https://script.google.com/macros/s/REPLACE_WITH_DEPLOYMENT_ID/exec';
    qs('#cfg-folder').value = 'REPLACE_FOLDER_ID';
    qs('#cfg-sheet').value = 'REPLACE_SHEET_ID';
  },
  updateStatusBar(){
    this.loadConfig();
    qs('#backend-url').textContent = this.state.cfg.backend || '(ยังไม่ตั้งค่า)';
    qs('#folder-id').textContent = this.state.cfg.folderId || '(ยังไม่ตั้งค่า)';
    qs('#sheet-id').textContent = this.state.cfg.sheetId || '(ยังไม่ตั้งค่า)';
  },

  async upload(){
    this.loadConfig();
    const {backend, folderId, sheetId} = this.state.cfg;
    if(!backend || !folderId || !sheetId){ this.toast('กรุณาตั้งค่าในแท็บ "ตั้งค่า" ก่อน'); return; }

    const title = qs('#title').value.trim() || new Date().toLocaleString();
    const message = qs('#message').value.trim();
    const imgs = Array.from(qs('#images').files||[]);
    const vids = Array.from(qs('#videos').files||[]);

    if(!message && imgs.length===0 && vids.length===0){
      this.toast('อย่างน้อยต้องมี ข้อความ หรือ รูป/วิดีโอ อย่างใดอย่างหนึ่ง'); return;
    }

    const setId = 'set_' + Date.now().toString(36);
    qs('#btn-upload').disabled = true; qs('#progress').textContent = 'กำลังเตรียมไฟล์...';

    // Read files as dataURL
    const files = [];
    const readFile = f => new Promise((res,rej)=>{
      const fr = new FileReader(); fr.onload = ()=>res({name:f.name, type:f.type, dataURL: fr.result}); fr.onerror=rej; fr.readAsDataURL(f);
    });
    for(const f of imgs) files.push(await readFile(f));
    for(const f of vids) files.push(await readFile(f));

    const payload = {
      mode: 'upload',
      sheetId, folderId,
      setId, title, message,
      files
    };

    const send = async () => {
      const r = await fetch(backend, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    };

    try{
      qs('#progress').textContent = 'กำลังอัพโหลดไปยัง Google...';
      const out = await send();
      this.toast('บันทึกสำเร็จ ✔');
      this.resetForm();
      // Jump to view page
      this.show('sets');
      await this.refreshSets();
      // Optionally scroll to the new set
    }catch(err){
      // Queue for retry
      this.state.queue.push(payload);
      localStorage.setItem('queue', JSON.stringify(this.state.queue));
      this.toast('ออฟไลน์/ผิดพลาด: เก็บเข้าคิวไว้แล้ว');
    }finally{
      qs('#btn-upload').disabled = false; qs('#progress').textContent = '';
    }
  },

  resetForm(){
    qs('#title').value=''; qs('#message').value='';
    qs('#images').value=''; qs('#videos').value='';
  },

  async sendQueueIfAny(){
    this.loadConfig();
    const {backend} = this.state.cfg;
    if(!backend) return;
    const q = this.state.queue;
    if(q.length===0) return;
    const left = [];
    for(const payload of q){
      try{
        await fetch(backend, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      }catch(e){
        left.push(payload);
      }
    }
    this.state.queue = left;
    localStorage.setItem('queue', JSON.stringify(left));
    if(q.length!==left.length) this.toast('ส่งคิวค้างสำเร็จบางส่วน');
  },

  async refreshSets(){
    await this.sendQueueIfAny();
    this.loadConfig();
    if(!this.state.cfg.backend || !this.state.cfg.sheetId){ qs('#sets').innerHTML='<div class="muted">ยังไม่ตั้งค่า</div>'; return; }
    const url = this.state.cfg.backend + '?mode=list&sheetId=' + encodeURIComponent(this.state.cfg.sheetId);
    try{
      const r = await fetch(url); const j = await r.json();
      this.state.sets = j.sets||[];
      qs('#sets').innerHTML = this.state.sets.map(App.renderSet).join('');
    }catch(e){
      qs('#sets').innerHTML = '<div class="muted">โหลดไม่ได้ ลองกดรีเฟรชอีกครั้ง</div>';
    }
  },

  renderSet(set){
    const media = [...(set.images||[]), ...(set.videos||[])];
    const mediaHtml = media.map(m=>`<div class="media">
      ${m.type.startsWith('image/') ? `<img src="${m.url}" alt="${m.name}" style="max-width:100%;border-radius:8px">`
        : `<video src="${m.url}" controls style="width:100%;border-radius:8px"></video>`}
      <div class="copy-row">
        <button class="btn btn-outline small" onclick="App.copyURL('${m.url.replace(/'/g, '%27')}')">คัดลอกลิงก์</button>
        <button class="btn btn-outline small" onclick="App.copyBinary('${m.url.replace(/'/g, '%27')}', '${m.type}')">คัดลอกไฟล์</button>
      </div>
    </div>`).join('');

    return `<div class="card set-card">
      <div><b>${set.title}</b> <span class="badge mono">${set.setId}</span></div>
      <div class="small">${new Date(set.timestamp).toLocaleString()}</div>
      ${set.message ? `<div class="media">
        <div style="white-space:pre-wrap">${App.escape(set.message)}</div>
        <div class="copy-row"><button class="btn btn-outline small" onclick="App.copyText(\`${App.escape(set.message,true)}\`)">คัดลอกข้อความ</button></div>
      </div>`:''}
      <div class="media-grid">${mediaHtml || '<div class="muted">ไม่มีสื่อในชุดนี้</div>'}</div>
    </div>`;
  },

  escape(s, forTemplate=false){
    if(!s) return '';
    if(forTemplate){
      return s.replace(/`/g,'\\`').replace(/\$\{/g,'\\${');
    }
    return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  },

  async copyText(text){
    try{ await navigator.clipboard.writeText(text); this.toast('คัดลอกข้อความแล้ว'); }catch{ this.toast('คัดลอกไม่สำเร็จ'); }
  },
  async copyURL(url){
    try{ await navigator.clipboard.writeText(url); this.toast('คัดลอกลิงก์แล้ว'); }catch{ this.toast('คัดลอกไม่สำเร็จ'); }
  },
  async copyBinary(url, mime){
    try{
      const b = await (await fetch(url)).blob();
      if(navigator.clipboard && window.ClipboardItem){
        await navigator.clipboard.write([ new ClipboardItem({ [mime]: b }) ]);
        this.toast('คัดลอกไฟล์ไปคลิปบอร์ดแล้ว');
      }else{
        await navigator.clipboard.writeText(url);
        this.toast('อุปกรณ์ไม่รองรับ: คัดลอกลิงก์แทน');
      }
    }catch(e){
      this.toast('คัดลอกไม่สำเร็จ');
    }
  }
};

window.addEventListener('online', ()=>App.sendQueueIfAny());
document.addEventListener('DOMContentLoaded', ()=>{ App.show('create'); });
