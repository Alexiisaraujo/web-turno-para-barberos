/* ═══════════════════════════════════════════════════════════
   BARBERPRO — APP.JS
   Estado completo en memoria + localStorage para persistencia
═══════════════════════════════════════════════════════════ */

/* ─── ESTADO GLOBAL ───────────────────────────────────────── */
let state = {
  admin: { user: 'alexis', pass: '123' },
  barbers: [],       // { id, name, displayName, user, pass, instagram, horaInicio, horaFin, dias, works[], totalGanado, cortesRealizados }
  services: [],      // { id, name, price, pct }
  clients: [],       // { id, name, lastname, phone, user, pass }
  turnos: [],        // { id, clientName, clientPhone, barberId, serviceId, fecha, hora, estado, totalPrice, barberEarning, createdAt }
  currentBarber: null,
  currentClient: null,
  // selecciones del flujo cliente
  selectedBarberId: null,
  selectedServiceId: null,
};

/* ─── PERSISTENCIA ────────────────────────────────────────── */
function saveState() {
  try { localStorage.setItem('barberpro_state', JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  try {
    const saved = localStorage.getItem('barberpro_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge conservando admin credentials
      state = { ...state, ...parsed, admin: state.admin };
    }
  } catch(e) {}
}

/* ─── UTILIDADES ──────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function timeNow() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatMoney(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getBarberById(id) {
  return state.barbers.find(b => b.id === id);
}

function getServiceById(id) {
  return state.services.find(s => s.id === id);
}

/* ─── TOAST ───────────────────────────────────────────────── */
let toastTimer = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  t.innerHTML = `<span>${icon}</span> ${msg}`;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3200);
}

/* ─── NAVEGACIÓN ENTRE PANTALLAS ──────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = '';
  });
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'flex';
    // Forzar reflow para que la animación se dispare
    void target.offsetWidth;
    target.classList.add('active');
  }
}

/* ─── MODALES ─────────────────────────────────────────────── */
function openModal(id) {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById(id).classList.remove('hidden');
}

function closeModals() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

/* ─── LOGIN ADMIN ─────────────────────────────────────────── */
function loginAdmin() {
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value.trim();
  const err  = document.getElementById('admin-error');

  if (user === state.admin.user && pass === state.admin.pass) {
    err.classList.add('hidden');
    renderAdminPanel();
    showScreen('screen-admin');
  } else {
    err.classList.remove('hidden');
    shake(document.querySelector('#screen-login-admin .login-box'));
  }
}

/* ─── LOGIN BARBERO ───────────────────────────────────────── */
function loginBarber() {
  const user = document.getElementById('barber-user').value.trim();
  const pass = document.getElementById('barber-pass').value.trim();
  const err  = document.getElementById('barber-error');

  const barber = state.barbers.find(b => b.user === user && b.pass === pass);
  if (barber) {
    err.classList.add('hidden');
    state.currentBarber = barber.id;
    renderBarberPanel();
    showScreen('screen-barber');
  } else {
    err.classList.remove('hidden');
    shake(document.querySelector('#screen-login-barber .login-box'));
  }
}

/* ─── REGISTRO CLIENTE ────────────────────────────────────── */
function registerClient() {
  const name     = document.getElementById('reg-name').value.trim();
  const lastname = document.getElementById('reg-lastname').value.trim();
  const phone    = document.getElementById('reg-phone').value.trim();
  const user     = document.getElementById('reg-user').value.trim();
  const pass     = document.getElementById('reg-pass').value.trim();
  const err      = document.getElementById('reg-error');

  if (!name || !lastname || !user || !pass) {
    err.textContent = 'Completá nombre, apellido, usuario y contraseña';
    err.classList.remove('hidden'); return;
  }
  if (state.clients.find(c => c.user === user)) {
    err.textContent = 'Ese usuario ya está en uso';
    err.classList.remove('hidden'); return;
  }

  const client = { id: uid(), name, lastname, phone, user, pass };
  state.clients.push(client);
  saveState();
  showToast(`¡Bienvenido, ${name}! Tu cuenta fue creada`);
  showScreen('screen-home');
  // Limpiar
  ['reg-name','reg-lastname','reg-phone','reg-user','reg-pass'].forEach(id => {
    document.getElementById(id).value = '';
  });
  err.classList.add('hidden');
}

/* ─── LOGOUT ──────────────────────────────────────────────── */
function logout() {
  state.currentBarber = null;
  state.currentClient = null;
  showScreen('screen-home');
  showToast('Sesión cerrada', 'info');
}

/* ─── SHAKE ANIMATION ─────────────────────────────────────── */
function shake(el) {
  if (!el) return;
  el.style.animation = 'none';
  el.offsetWidth;
  el.style.animation = 'shake 0.4s ease';
  setTimeout(() => el.style.animation = '', 400);
}

// Inyectar keyframes de shake si no existen
(function injectShake() {
  if (document.getElementById('shake-kf')) return;
  const style = document.createElement('style');
  style.id = 'shake-kf';
  style.textContent = `
    @keyframes shake {
      0%,100%{ transform: translateX(0); }
      20%    { transform: translateX(-8px); }
      40%    { transform: translateX(8px); }
      60%    { transform: translateX(-5px); }
      80%    { transform: translateX(5px); }
    }`;
  document.head.appendChild(style);
})();

/* ══════════════════════════════════════════════════════════
   PANEL ADMINISTRADOR
══════════════════════════════════════════════════════════ */

function adminNav(btn) {
  document.querySelectorAll('#screen-admin .nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const panelId = btn.dataset.panel;
  document.querySelectorAll('#screen-admin .admin-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  // Render del panel correspondiente
  if (panelId === 'panel-dashboard')     renderDashboard();
  if (panelId === 'panel-barbers')       renderBarbersList();
  if (panelId === 'panel-turnos')        renderAdminTurnos();
  if (panelId === 'panel-precios')       renderServicios();
  if (panelId === 'panel-contabilidad')  renderContabilidad();
}

function renderAdminPanel() {
  renderDashboard();
  renderBarbersList();
  renderAdminTurnos();
  renderServicios();
  renderContabilidad();
  populateBarberFilter();
}

/* ── Dashboard ──────────────────────────────────────────── */
function renderDashboard() {
  const turnosHoy = state.turnos.filter(t => t.fecha === today());
  const completadosHoy = turnosHoy.filter(t => t.estado === 'completado');
  const recaudadoHoy = completadosHoy.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

  document.getElementById('stat-turnos').textContent = turnosHoy.length;
  document.getElementById('stat-recaudado').textContent = formatMoney(recaudadoHoy);
  document.getElementById('stat-barberos-activos').textContent = state.barbers.length;
  document.getElementById('stat-clientes').textContent = state.clients.length;

  // Últimos turnos completados
  const tbody = document.getElementById('tbody-last-turnos');
  const ultimos = [...state.turnos]
    .filter(t => t.estado === 'completado')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  if (!ultimos.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Sin turnos completados hoy</td></tr>';
    return;
  }

  tbody.innerHTML = ultimos.map(t => {
    const barber  = getBarberById(t.barberId);
    const service = getServiceById(t.serviceId);
    return `<tr>
      <td>${escHtml(t.clientName)}</td>
      <td>${escHtml(barber?.displayName || barber?.name || '—')}</td>
      <td>${escHtml(service?.name || '—')}</td>
      <td style="color:var(--gold);font-weight:600">${formatMoney(t.totalPrice)}</td>
      <td>${t.hora || '—'}</td>
    </tr>`;
  }).join('');
}

/* ── Barberos (admin) ───────────────────────────────────── */
function renderBarbersList() {
  const container = document.getElementById('barbers-list');
  if (!state.barbers.length) {
    container.innerHTML = '<p style="color:var(--gray);font-size:0.875rem;grid-column:1/-1;padding:1rem 0">No hay barberos creados aún. Hacé clic en "+ Nuevo barbero".</p>';
    return;
  }
  container.innerHTML = state.barbers.map(b => {
    const cortes = state.turnos.filter(t => t.barberId === b.id && t.estado === 'completado').length;
    const ganado = state.turnos
      .filter(t => t.barberId === b.id && t.estado === 'completado')
      .reduce((s, t) => s + (t.barberEarning || 0), 0);
    return `
    <div class="barber-item-card">
      <div class="barber-item-top">
        <div class="barber-item-avatar">✂</div>
        <div class="barber-item-info">
          <strong>${escHtml(b.displayName || b.name)}</strong>
          <span>@${escHtml(b.user)}</span>
        </div>
      </div>
      <div style="display:flex;gap:1.5rem;font-size:0.78rem;color:var(--gray-light);font-family:var(--font-mono)">
        <span>✂ ${cortes} cortes</span>
        <span style="color:var(--gold)">${formatMoney(ganado)}</span>
        ${b.instagram ? `<span>📷 ${escHtml(b.instagram)}</span>` : ''}
      </div>
      <div class="barber-item-actions">
        <button class="btn-action" onclick="viewBarberModal('${b.id}')">Ver perfil</button>
        <button class="btn-action danger" onclick="deleteBarber('${b.id}')">Eliminar</button>
      </div>
    </div>`;
  }).join('');
}

function createBarber() {
  const name = document.getElementById('nb-name').value.trim();
  const user = document.getElementById('nb-user').value.trim();
  const pass = document.getElementById('nb-pass').value.trim();
  const err  = document.getElementById('nb-error');

  if (!name || !user || !pass) {
    err.textContent = 'Completá todos los campos';
    err.classList.remove('hidden'); return;
  }
  if (state.barbers.find(b => b.user === user)) {
    err.textContent = 'Ese usuario ya existe';
    err.classList.remove('hidden'); return;
  }

  const barber = {
    id: uid(), name, displayName: name, user, pass,
    instagram: '', horaInicio: '09:00', horaFin: '18:00',
    dias: ['Lun','Mar','Mié','Jue','Vie'],
    works: [], totalGanado: 0, cortesRealizados: 0
  };
  state.barbers.push(barber);
  saveState();
  closeModals();
  showToast(`Barbero "${name}" creado`);
  renderBarbersList();
  renderDashboard();
  populateBarberFilter();
  // Limpiar
  ['nb-name','nb-user','nb-pass'].forEach(id => document.getElementById(id).value = '');
  err.classList.add('hidden');
}

function deleteBarber(id) {
  if (!confirm('¿Seguro que querés eliminar este barbero?')) return;
  state.barbers = state.barbers.filter(b => b.id !== id);
  saveState();
  renderBarbersList();
  renderDashboard();
  showToast('Barbero eliminado', 'info');
}

function viewBarberModal(id) {
  const b = getBarberById(id);
  if (!b) return;
  const cortes = state.turnos.filter(t => t.barberId === id && t.estado === 'completado').length;
  const ganado = state.turnos
    .filter(t => t.barberId === id && t.estado === 'completado')
    .reduce((s, t) => s + (t.barberEarning || 0), 0);

  document.getElementById('modal-barber-title').textContent = b.displayName || b.name;
  document.getElementById('modal-barber-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div class="field-group"><label>Usuario</label>
        <div style="padding:.6rem 1rem;background:var(--black-3);border-radius:var(--radius);font-family:var(--font-mono);font-size:.85rem">${escHtml(b.user)}</div>
      </div>
      <div class="field-group"><label>Contraseña</label>
        <div style="padding:.6rem 1rem;background:var(--black-3);border-radius:var(--radius);font-family:var(--font-mono);font-size:.85rem">${escHtml(b.pass)}</div>
      </div>
      <div class="field-group"><label>Horario</label>
        <div style="padding:.6rem 1rem;background:var(--black-3);border-radius:var(--radius);font-size:.85rem">${b.horaInicio} — ${b.horaFin}</div>
      </div>
      <div class="field-group"><label>Instagram</label>
        <div style="padding:.6rem 1rem;background:var(--black-3);border-radius:var(--radius);font-size:.85rem">${b.instagram || '—'}</div>
      </div>
      <div class="field-group"><label>Días</label>
        <div style="padding:.6rem 1rem;background:var(--black-3);border-radius:var(--radius);font-size:.85rem">${(b.dias || []).join(', ') || '—'}</div>
      </div>
    </div>
    <div style="display:flex;gap:1rem;margin-top:.5rem">
      <div class="stat-card" style="flex:1;padding:1rem">
        <div class="stat-num" style="font-size:1.8rem">${cortes}</div>
        <div class="stat-label">Cortes</div>
      </div>
      <div class="stat-card gold" style="flex:1;padding:1rem">
        <div class="stat-num" style="font-size:1.8rem">${formatMoney(ganado)}</div>
        <div class="stat-label">A pagar</div>
      </div>
    </div>
  `;
  openModal('modal-view-barber');
}

/* ── Turnos admin ────────────────────────────────────────── */
function populateBarberFilter() {
  const sel = document.getElementById('filter-barber');
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos los barberos</option>' +
    state.barbers.map(b => `<option value="${b.id}">${escHtml(b.displayName || b.name)}</option>`).join('');
  sel.value = current;
}

function renderAdminTurnos() {
  const filterBarber = document.getElementById('filter-barber')?.value || '';
  const filterEstado = document.getElementById('filter-estado')?.value || '';

  let list = [...state.turnos].sort((a, b) => b.createdAt - a.createdAt);
  if (filterBarber) list = list.filter(t => t.barberId === filterBarber);
  if (filterEstado) list = list.filter(t => t.estado === filterEstado);

  const tbody = document.getElementById('tbody-admin-turnos');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">No hay turnos</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(t => {
    const barber  = getBarberById(t.barberId);
    const service = getServiceById(t.serviceId);
    return `<tr>
      <td>${escHtml(t.clientName)}</td>
      <td>${escHtml(barber?.displayName || barber?.name || '—')}</td>
      <td>${escHtml(service?.name || '—')}</td>
      <td style="color:var(--gold)">${formatMoney(t.totalPrice)}</td>
      <td>${formatDate(t.fecha)} ${t.hora || ''}</td>
      <td><span class="badge ${t.estado}">${t.estado}</span></td>
      <td>
        ${t.estado === 'pendiente' ? `<button class="btn-action" onclick="adminCancelarTurno('${t.id}')">Cancelar</button>` : ''}
        ${t.estado === 'completado' ? `<span style="color:var(--gray);font-size:.75rem">—</span>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function adminCancelarTurno(id) {
  const t = state.turnos.find(t => t.id === id);
  if (!t) return;
  t.estado = 'cancelado';
  saveState();
  renderAdminTurnos();
  renderDashboard();
  showToast('Turno cancelado', 'info');
}

/* ── Servicios ───────────────────────────────────────────── */
function renderServicios() {
  const tbody = document.getElementById('tbody-servicios');
  if (!state.services.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Sin servicios aún. Creá el primero.</td></tr>';
    return;
  }
  tbody.innerHTML = state.services.map(s => {
    const barberEarn   = (s.price * s.pct / 100);
    const negocioEarn  = s.price - barberEarn;
    return `<tr>
      <td>${escHtml(s.name)}</td>
      <td style="color:var(--gold);font-weight:600">${formatMoney(s.price)}</td>
      <td>${s.pct}%</td>
      <td style="color:#58d68d">${formatMoney(barberEarn)}</td>
      <td>${formatMoney(negocioEarn)}</td>
      <td>
        <button class="btn-action" onclick="editService('${s.id}')">Editar</button>
        <button class="btn-action danger" onclick="deleteService('${s.id}')">Eliminar</button>
      </td>
    </tr>`;
  }).join('');
}

function createService() {
  const name  = document.getElementById('ns-name').value.trim();
  const price = parseFloat(document.getElementById('ns-price').value);
  const pct   = parseFloat(document.getElementById('ns-pct').value);
  const err   = document.getElementById('ns-error');

  if (!name || isNaN(price) || isNaN(pct)) {
    err.textContent = 'Completá todos los campos correctamente';
    err.classList.remove('hidden'); return;
  }
  if (pct < 0 || pct > 100) {
    err.textContent = 'El porcentaje debe estar entre 0 y 100';
    err.classList.remove('hidden'); return;
  }

  // Si hay id en edición
  const editId = document.getElementById('ns-name').dataset.editId;
  if (editId) {
    const svc = state.services.find(s => s.id === editId);
    if (svc) { svc.name = name; svc.price = price; svc.pct = pct; }
    delete document.getElementById('ns-name').dataset.editId;
    document.querySelector('#modal-new-service .modal-header h3').textContent = 'Nuevo servicio';
  } else {
    state.services.push({ id: uid(), name, price, pct });
  }

  saveState();
  closeModals();
  showToast(`Servicio "${name}" guardado`);
  renderServicios();
  ['ns-name','ns-price','ns-pct'].forEach(id => document.getElementById(id).value = '');
  err.classList.add('hidden');
}

function editService(id) {
  const s = state.services.find(s => s.id === id);
  if (!s) return;
  document.getElementById('ns-name').value = s.name;
  document.getElementById('ns-price').value = s.price;
  document.getElementById('ns-pct').value = s.pct;
  document.getElementById('ns-name').dataset.editId = id;
  document.querySelector('#modal-new-service .modal-header h3').textContent = 'Editar servicio';
  document.getElementById('ns-error').classList.add('hidden');
  openModal('modal-new-service');
}

function deleteService(id) {
  if (!confirm('¿Eliminar este servicio?')) return;
  state.services = state.services.filter(s => s.id !== id);
  saveState();
  renderServicios();
  showToast('Servicio eliminado', 'info');
}

/* ── Contabilidad ────────────────────────────────────────── */
function renderContabilidad() {
  const tbody = document.getElementById('tbody-contabilidad');
  if (!state.barbers.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Sin barberos registrados</td></tr>';
    return;
  }
  tbody.innerHTML = state.barbers.map(b => {
    const completados = state.turnos.filter(t => t.barberId === b.id && t.estado === 'completado');
    const totalFacturado = completados.reduce((s, t) => s + (t.totalPrice || 0), 0);
    const aPagar = completados.reduce((s, t) => s + (t.barberEarning || 0), 0);
    const gananciaLocal = totalFacturado - aPagar;
    return `<tr>
      <td><strong>${escHtml(b.displayName || b.name)}</strong></td>
      <td style="font-family:var(--font-mono)">${completados.length}</td>
      <td style="color:var(--white-dim);font-family:var(--font-mono)">${formatMoney(totalFacturado)}</td>
      <td style="color:var(--gold);font-weight:600;font-family:var(--font-mono)">${formatMoney(aPagar)}</td>
      <td style="color:#58d68d;font-family:var(--font-mono)">${formatMoney(gananciaLocal)}</td>
    </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   PANEL BARBERO
══════════════════════════════════════════════════════════ */

function barberNav(btn) {
  document.querySelectorAll('#screen-barber .nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const panelId = btn.dataset.panel;
  document.querySelectorAll('#screen-barber .admin-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  if (panelId === 'bp-turnos')    renderBarberTurnos();
  if (panelId === 'bp-perfil')    loadBarberProfile();
  if (panelId === 'bp-trabajos')  renderWorks();
  if (panelId === 'bp-ganancias') renderBarberGanancias();
}

function renderBarberPanel() {
  const b = getBarberById(state.currentBarber);
  if (!b) return;
  document.getElementById('barber-name-label').textContent = b.displayName || b.name;
  renderBarberTurnos();
  loadBarberProfile();
  renderWorks();
  renderBarberGanancias();
}

/* ── Turnos del barbero ──────────────────────────────────── */
function renderBarberTurnos() {
  const tbody = document.getElementById('tbody-barber-turnos');
  const myTurnos = state.turnos
    .filter(t => t.barberId === state.currentBarber)
    .sort((a, b) => {
      // Ordenar: pendientes primero, luego por fecha/hora
      const order = { pendiente:0, confirmado:1, completado:2, cancelado:3 };
      return (order[a.estado] - order[b.estado]) || a.fecha.localeCompare(b.fecha);
    });

  if (!myTurnos.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No tenés turnos asignados</td></tr>';
    return;
  }
  tbody.innerHTML = myTurnos.map(t => {
    const service = getServiceById(t.serviceId);
    const canComplete = t.estado === 'pendiente' || t.estado === 'confirmado';
    return `<tr>
      <td>${escHtml(t.clientName)}</td>
      <td>${escHtml(service?.name || '—')}</td>
      <td style="color:var(--gold)">${formatMoney(t.totalPrice)}</td>
      <td>${formatDate(t.fecha)} ${t.hora || ''}</td>
      <td><span class="badge ${t.estado}">${t.estado}</span></td>
      <td>
        ${canComplete
          ? `<button class="btn-action success" onclick="completarCorte('${t.id}')">✓ Terminé</button>`
          : `<span style="color:var(--gray);font-size:.75rem">—</span>`
        }
      </td>
    </tr>`;
  }).join('');
}

function completarCorte(turnoId) {
  const t = state.turnos.find(t => t.id === turnoId);
  if (!t) return;
  t.estado = 'completado';
  t.completadoAt = Date.now();

  // Sumar ganancias al barbero
  const barber = getBarberById(t.barberId);
  if (barber) {
    barber.totalGanado = (barber.totalGanado || 0) + (t.barberEarning || 0);
    barber.cortesRealizados = (barber.cortesRealizados || 0) + 1;
  }

  saveState();
  renderBarberTurnos();
  renderBarberGanancias();
  showToast(`¡Corte completado! Ganaste ${formatMoney(t.barberEarning)}`);
}

/* ── Perfil barbero ──────────────────────────────────────── */
function loadBarberProfile() {
  const b = getBarberById(state.currentBarber);
  if (!b) return;
  document.getElementById('barber-display-name').value = b.displayName || b.name;
  document.getElementById('barber-instagram').value = b.instagram || '';
  document.getElementById('barber-hora-inicio').value = b.horaInicio || '09:00';
  document.getElementById('barber-hora-fin').value = b.horaFin || '18:00';

  // Días
  const checks = document.querySelectorAll('#dias-check input[type="checkbox"]');
  checks.forEach(cb => {
    cb.checked = (b.dias || []).includes(cb.value);
  });
}

function saveBarberProfile() {
  const b = getBarberById(state.currentBarber);
  if (!b) return;
  b.displayName = document.getElementById('barber-display-name').value.trim() || b.name;
  b.instagram   = document.getElementById('barber-instagram').value.trim();
  b.horaInicio  = document.getElementById('barber-hora-inicio').value;
  b.horaFin     = document.getElementById('barber-hora-fin').value;

  const checks = document.querySelectorAll('#dias-check input[type="checkbox"]');
  b.dias = [...checks].filter(cb => cb.checked).map(cb => cb.value);

  document.getElementById('barber-name-label').textContent = b.displayName;
  saveState();
  showToast('Perfil actualizado');
}

/* ── Trabajos (portfolio) ────────────────────────────────── */
function previewWork(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('La imagen supera 5MB', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const b = getBarberById(state.currentBarber);
    if (!b) return;
    if (!b.works) b.works = [];
    b.works.push({ id: uid(), src: e.target.result, date: today() });
    saveState();
    renderWorks();
    showToast('Trabajo subido al portfolio');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function renderWorks() {
  const b = getBarberById(state.currentBarber);
  const grid = document.getElementById('works-grid');
  if (!b || !b.works || !b.works.length) {
    grid.innerHTML = '<p style="color:var(--gray);font-size:.875rem">Todavía no subiste fotos de tus trabajos.</p>';
    return;
  }
  grid.innerHTML = b.works.map(w => `
    <div class="work-img-wrap" title="${w.date}">
      <img src="${w.src}" alt="Trabajo" loading="lazy" />
      <button onclick="deleteWork('${w.id}')" style="
        position:absolute;top:8px;right:8px;
        background:rgba(0,0,0,.7);border:none;border-radius:50%;
        width:28px;height:28px;color:white;cursor:pointer;
        font-size:.8rem;display:flex;align-items:center;justify-content:center;
        opacity:0;transition:opacity .2s;
      " class="delete-work-btn">✕</button>
    </div>
  `).join('');

  // Mostrar botón al hover
  grid.querySelectorAll('.work-img-wrap').forEach(wrap => {
    const btn = wrap.querySelector('.delete-work-btn');
    wrap.addEventListener('mouseenter', () => btn.style.opacity = '1');
    wrap.addEventListener('mouseleave', () => btn.style.opacity = '0');
  });
}

function deleteWork(workId) {
  const b = getBarberById(state.currentBarber);
  if (!b) return;
  b.works = b.works.filter(w => w.id !== workId);
  saveState();
  renderWorks();
  showToast('Foto eliminada', 'info');
}

/* ── Ganancias del barbero ───────────────────────────────── */
function renderBarberGanancias() {
  const b = getBarberById(state.currentBarber);
  if (!b) return;

  const completados = state.turnos.filter(t => t.barberId === b.id && t.estado === 'completado');
  const totalGanado = completados.reduce((s, t) => s + (t.barberEarning || 0), 0);
  const hoyGanado   = completados
    .filter(t => t.fecha === today())
    .reduce((s, t) => s + (t.barberEarning || 0), 0);

  document.getElementById('barber-total-ganado').textContent = formatMoney(totalGanado);
  document.getElementById('barber-total-cortes').textContent = completados.length;
  document.getElementById('barber-hoy-ganado').textContent   = formatMoney(hoyGanado);

  const tbody = document.getElementById('tbody-barber-ganancias');
  if (!completados.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">Sin cortes registrados aún</td></tr>';
    return;
  }
  tbody.innerHTML = [...completados]
    .sort((a, bb) => bb.completadoAt - a.completadoAt)
    .map(t => {
      const service = getServiceById(t.serviceId);
      return `<tr>
        <td>${escHtml(service?.name || '—')}</td>
        <td>${escHtml(t.clientName)}</td>
        <td style="font-family:var(--font-mono)">${formatMoney(t.totalPrice)}</td>
        <td style="color:var(--gold);font-weight:600;font-family:var(--font-mono)">${formatMoney(t.barberEarning)}</td>
        <td style="font-family:var(--font-mono)">${formatDate(t.fecha)}</td>
      </tr>`;
    }).join('');
}

/* ══════════════════════════════════════════════════════════
   FLUJO CLIENTE — SACAR TURNO
══════════════════════════════════════════════════════════ */

function initClientFlow() {
  state.selectedBarberId  = null;
  state.selectedServiceId = null;

  // Mostrar solo step-barber, ocultar el resto
  ['step-barber','step-service','step-datetime','step-datos','step-ok'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById('step-barber').classList.remove('hidden');

  renderBarberPicks();

  // Fecha mínima = hoy
  document.getElementById('client-fecha').min = today();
  document.getElementById('client-fecha').value = today();
}

function renderBarberPicks() {
  const container = document.getElementById('barber-cards');
  const available = state.barbers.filter(b => b.dias && b.dias.length);

  if (!available.length) {
    container.innerHTML = '<p style="color:var(--gray);font-size:.875rem;grid-column:1/-1">No hay barberos disponibles aún.</p>';
    return;
  }

  container.innerHTML = available.map(b => `
    <div class="barber-pick-card" onclick="selectBarber('${b.id}', this)" id="pick-${b.id}">
      <div class="barber-pick-avatar">✂</div>
      <div class="barber-pick-name">${escHtml(b.displayName || b.name)}</div>
      <div class="barber-pick-hours">${b.horaInicio || '09:00'} – ${b.horaFin || '18:00'}</div>
      ${b.instagram ? `<div class="barber-pick-ig">${escHtml(b.instagram)}</div>` : ''}
      ${b.dias ? `<div class="barber-pick-hours">${b.dias.join(' · ')}</div>` : ''}
    </div>
  `).join('');
}

function selectBarber(id, el) {
  state.selectedBarberId = id;
  document.querySelectorAll('.barber-pick-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  // Pequeño delay visual antes de avanzar
  setTimeout(() => {
    document.getElementById('step-barber').classList.add('hidden');
    renderServicePicks();
    document.getElementById('step-service').classList.remove('hidden');
  }, 180);
}

function renderServicePicks() {
  const container = document.getElementById('service-list');
  if (!state.services.length) {
    container.innerHTML = '<p style="color:var(--gray);font-size:.875rem">No hay servicios cargados aún.</p>';
    return;
  }
  container.innerHTML = state.services.map(s => `
    <div class="service-pick-item" onclick="selectService('${s.id}', this)">
      <span class="service-name">${escHtml(s.name)}</span>
      <span class="service-price">${formatMoney(s.price)}</span>
    </div>
  `).join('');
}

function selectService(id, el) {
  state.selectedServiceId = id;
  document.querySelectorAll('.service-pick-item').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  setTimeout(() => {
    document.getElementById('step-service').classList.add('hidden');
    document.getElementById('step-datetime').classList.remove('hidden');
  }, 180);
}

function goToStepData() {
  const fecha = document.getElementById('client-fecha').value;
  const hora  = document.getElementById('client-hora').value;
  if (!fecha || !hora) { showToast('Elegí fecha y hora', 'error'); return; }
  document.getElementById('step-datetime').classList.add('hidden');
  document.getElementById('step-datos').classList.remove('hidden');
}

function resetStep(showId, hideId) {
  document.getElementById(hideId).classList.add('hidden');
  document.getElementById(showId).classList.remove('hidden');
}

function confirmarTurno() {
  const nombre = document.getElementById('client-nombre').value.trim();
  const tel    = document.getElementById('client-tel').value.trim();
  const fecha  = document.getElementById('client-fecha').value;
  const hora   = document.getElementById('client-hora').value;

  if (!nombre) { showToast('Ingresá tu nombre', 'error'); return; }
  if (!state.selectedBarberId || !state.selectedServiceId) {
    showToast('Seleccioná barbero y servicio', 'error'); return;
  }

  const service = getServiceById(state.selectedServiceId);
  const barber  = getBarberById(state.selectedBarberId);
  if (!service || !barber) { showToast('Error interno', 'error'); return; }

  const barberEarning = Math.round(service.price * service.pct / 100);

  const turno = {
    id: uid(),
    clientName: nombre,
    clientPhone: tel,
    barberId: state.selectedBarberId,
    serviceId: state.selectedServiceId,
    fecha, hora,
    estado: 'pendiente',
    totalPrice: service.price,
    barberEarning,
    createdAt: Date.now(),
    completadoAt: null,
  };

  state.turnos.push(turno);
  saveState();

  // Mostrar confirmación
  document.getElementById('step-datos').classList.add('hidden');
  document.getElementById('step-ok').classList.remove('hidden');
  document.getElementById('confirm-detail').innerHTML = `
    <strong>Cliente:</strong> ${escHtml(nombre)}<br>
    <strong>Barbero:</strong> ${escHtml(barber.displayName || barber.name)}<br>
    <strong>Servicio:</strong> ${escHtml(service.name)}<br>
    <strong>Precio:</strong> ${formatMoney(service.price)}<br>
    <strong>Fecha:</strong> ${formatDate(fecha)} a las ${hora}<br>
    <strong>Estado:</strong> Pendiente de confirmación
  `;
}

/* ─── SEGURIDAD: escape HTML ──────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── ENTER en inputs de login ────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const active = document.querySelector('.screen.active');
  if (!active) return;
  if (active.id === 'screen-login-admin')  loginAdmin();
  if (active.id === 'screen-login-barber') loginBarber();
  if (active.id === 'screen-register')     registerClient();
});

/* ─── CERRAR modal con ESC ────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModals();
});

/* ─── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Seed: datos de ejemplo si está vacío (primera vez)
  if (!state.services.length) {
    state.services = [
      { id: uid(), name: 'Corte clásico',       price: 2500, pct: 50 },
      { id: uid(), name: 'Corte + barba',        price: 4000, pct: 50 },
      { id: uid(), name: 'Afeitado navaja',      price: 2000, pct: 50 },
      { id: uid(), name: 'Corte + barba + ceja', price: 5000, pct: 55 },
    ];
    saveState();
  }

  // Hook: cuando se abre la pantalla cliente, inicializar flujo
  const origShowScreen = window.showScreen;
  window.showScreen = function(id) {
    origShowScreen(id);
    if (id === 'screen-client-home') initClientFlow();
  };

  showScreen('screen-home');
});
