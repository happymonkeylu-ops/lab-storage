const STORAGE_KEY = 'lab-storage-items-v3';
const demoData = [
  { id: 1, itemName: 'Taq DNA Polymerase', room: 'Room 101', refrigerator: '4\u00b0C \u51b0\u7bb1 1', temperature: '4\u00b0C', shelf: '\u7b2c 2 \u5c42', storageDate: '2026-08-18', expiryDate: '2027-08-18', productCode: 'TAQ-200', price: '180.00', capacity: '500 \u03bcL', notes: 'PCR \u5b9e\u9a8c\u8bd5\u5242' },
  { id: 2, itemName: 'DMEM/F12 \u57f9\u517b\u57fa', room: 'Room 203', refrigerator: '4\u00b0C \u51b0\u7bb1 2', temperature: '4\u00b0C', shelf: 'A \u533a', storageDate: '2026-07-03', expiryDate: '', productCode: '', price: '', capacity: '500 mL', notes: '\u6709\u6548\u671f\u5f85\u786e\u8ba4' },
  { id: 3, itemName: '\u6297\u4f53\u6837\u54c1', room: 'Room 101', refrigerator: '-20\u00b0C \u51b0\u7bb1 1', temperature: '-20\u00b0C', shelf: '\u7b2c 1 \u5c42', storageDate: '2026-01-05', expiryDate: '2026-06-30', productCode: 'AB-7781', price: '420.50', capacity: '', notes: '' }
];

const $ = (id) => document.getElementById(id);
const form = $('itemForm');
const cloudConfig = window.SUPABASE_CONFIG || {};
const cloudEnabled = Boolean(cloudConfig.url && cloudConfig.anonKey && window.supabase);
const cloudClient = cloudEnabled ? window.supabase.createClient(cloudConfig.url, cloudConfig.anonKey) : null;
let items = [];
let lastQuery = { text: '', room: 'all', expiry: 'all' };

function loadLocalItems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) { console.warn('local data read failed', error); }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
  return [...demoData];
}
function saveLocalItems() { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
async function loadItems() {
  if (!cloudEnabled) return loadLocalItems();
  const { data, error } = await cloudClient.from('inventory_items').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  if (!data.length) {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      const localItems = JSON.parse(localData);
      if (localItems.length) {
        for (const item of localItems) await saveItem(item);
        return localItems;
      }
    }
  }
  return data.map((item) => ({ id: item.id, itemName: item.item_name, room: item.room || '', refrigerator: item.refrigerator || '', temperature: item.temperature || '', shelf: item.shelf || '', storageDate: item.storage_date || '', expiryDate: item.expiry_date || '', productCode: item.product_code || '', price: item.price === null ? '' : String(item.price), currency: item.currency || 'CNY', capacity: item.capacity || '', notes: item.notes || '' }));
}
function showDataError(error) {
  console.error('Inventory data operation failed', error);
  window.alert(cloudEnabled ? '云端数据操作失败，请检查 Supabase 配置和数据库权限。' : '本地数据操作失败，请检查浏览器存储权限。');
}
async function saveItem(item) {
  if (!cloudEnabled) { saveLocalItems(); return; }
  const record = { id: item.id, item_name: item.itemName, room: item.room || null, refrigerator: item.refrigerator || null, temperature: item.temperature || null, shelf: item.shelf || null, storage_date: item.storageDate || null, expiry_date: item.expiryDate || null, product_code: item.productCode || null, price: item.price === '' ? null : Number(item.price), currency: item.currency || 'CNY', capacity: item.capacity || null, notes: item.notes || null, updated_at: new Date().toISOString() };
  const { error } = await cloudClient.from('inventory_items').upsert(record);
  if (error) throw error;
}
async function deleteItem(id) {
  if (!cloudEnabled) { saveLocalItems(); return; }
  const { error } = await cloudClient.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}
function getValue(id) { return $(id).value.trim(); }
function display(text) { return text || '<span class="muted-value">\u672a\u586b\u5199</span>'; }
function formatDate(dateString) {
  if (!dateString) return '<span class="muted-value">\u672a\u586b\u5199</span>';
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
function isExpired(dateString) {
  if (!dateString) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${dateString}T00:00:00`);
  return !Number.isNaN(expiry.getTime()) && expiry < today;
}
function buildRow(item) {
  const tr = document.createElement('tr');
  const expired = isExpired(item.expiryDate);
  const currency = item.currency || 'CNY';
  tr.innerHTML = `<td><div class="item-name">${display(item.itemName)}</div>${item.notes ? `<div class="item-note">${item.notes}</div>` : ''}</td><td><div>${display(item.room)}</div><div class="location-sub">${display(item.refrigerator)} &middot; ${display(item.shelf)}</div></td><td><span class="temperature-tag">${display(item.temperature)}</span></td><td><div class="date-line"><span class="date-label">\u6536\u8d27</span>${formatDate(item.storageDate)}</div><div class="date-line"><span class="date-label">\u6709\u6548\u81f3</span>${formatDate(item.expiryDate)}</div>${expired ? '<span class="status-chip expired">\u5df2\u8fc7\u671f</span>' : item.expiryDate ? '<span class="status-chip active">\u6709\u6548</span>' : ''}</td><td><div>${display(item.productCode)}</div><div class="location-sub">${display(item.capacity)}</div></td><td>${item.price ? `<span class="price-value">${currency} ${Number(item.price).toFixed(2)}</span>` : '<span class="muted-value">\u672a\u586b\u5199</span>'}</td><td><div class="actions"><button class="row-action edit-btn" type="button" data-action="edit" data-id="${item.id}">\u7f16\u8f91</button><button class="row-action delete-btn" type="button" data-action="delete" data-id="${item.id}">\u5220\u9664</button></div></td>`;
  return tr;
}
function populateRoomFilter() {
  const current = $('roomFilter').value;
  const rooms = [...new Set(items.map((item) => item.room).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  $('roomFilter').innerHTML = '<option value="all">\u5168\u90e8\u623f\u95f4</option>' + rooms.map((room) => `<option value="${room}">${room}</option>`).join('');
  $('roomFilter').value = rooms.includes(current) ? current : 'all';
}
function renderSummary() {
  $('totalCount').textContent = items.length;
  $('roomCount').textContent = new Set(items.map((item) => item.room).filter(Boolean)).size;
  $('fridgeCount').textContent = new Set(items.map((item) => item.refrigerator).filter(Boolean)).size;
  $('expiredCount').textContent = items.filter((item) => isExpired(item.expiryDate)).length;
}
function matches(item, query) {
  const searchable = [item.itemName, item.room, item.refrigerator, item.productCode, item.notes, item.temperature, item.shelf, item.capacity].join(' ').toLowerCase();
  const roomMatch = query.room === 'all' || item.room === query.room;
  const expiryMatch = query.expiry === 'all' || (query.expiry === 'expired' && isExpired(item.expiryDate)) || (query.expiry === 'active' && item.expiryDate && !isExpired(item.expiryDate)) || (query.expiry === 'unknown' && !item.expiryDate);
  return (!query.text || searchable.includes(query.text)) && roomMatch && expiryMatch;
}
function renderTable(query = lastQuery) {
  lastQuery = query;
  const filtered = items.filter((item) => matches(item, query));
  $('resultCount').textContent = `${filtered.length} \u6761\u8bb0\u5f55`;
  $('itemTableBody').innerHTML = '';
  if (!filtered.length) { $('itemTableBody').innerHTML = '<tr><td colspan="7" class="empty-state"><strong>\u6ca1\u6709\u5339\u914d\u7684\u8bb0\u5f55</strong><span>\u8c03\u6574\u6761\u4ef6\u540e\u70b9\u51fb\u67e5\u627e\u3002</span></td></tr>'; return; }
  filtered.forEach((item) => $('itemTableBody').appendChild(buildRow(item)));
}
function renderAll() { populateRoomFilter(); renderSummary(); renderTable(); }
function resetForm() { form.reset(); $('itemId').value = ''; $('formTitle').textContent = '\u65b0\u589e\u7269\u54c1'; }
function openForm(item) {
  if (item) {
    $('itemId').value = item.id;
    ['itemName', 'room', 'refrigerator', 'temperature', 'shelf', 'storageDate', 'expiryDate', 'productCode', 'price', 'capacity', 'notes'].forEach((id) => { $(id).value = item[id] || ''; });
    $('currency').value = item.currency || 'CNY';
    $('formTitle').textContent = '\u7f16\u8f91\u7269\u54c1';
  } else { resetForm(); }
  $('formPanel').hidden = false;
  $('itemName').focus();
}
function closeForm() { $('formPanel').hidden = true; resetForm(); }
function readQuery() { return { text: $('searchInput').value.trim().toLowerCase(), room: $('roomFilter').value, expiry: $('expiryFilter').value }; }

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const entry = { id: $('itemId').value ? Number($('itemId').value) : Date.now(), itemName: getValue('itemName'), room: getValue('room'), refrigerator: getValue('refrigerator'), temperature: getValue('temperature'), shelf: getValue('shelf'), storageDate: getValue('storageDate'), expiryDate: getValue('expiryDate'), productCode: getValue('productCode'), price: getValue('price'), currency: getValue('currency') || 'CNY', capacity: getValue('capacity'), notes: getValue('notes') };
  const index = items.findIndex((item) => item.id === entry.id);
  const previousItem = index === -1 ? null : items[index];
  if (index === -1) items.unshift(entry); else items[index] = entry;
  try { await saveItem(entry); renderAll(); closeForm(); } catch (error) { if (index === -1) items.shift(); else items[index] = previousItem; renderAll(); showDataError(error); }
});
$('findBtn').addEventListener('click', () => renderTable(readQuery()));
$('clearFiltersBtn').addEventListener('click', () => { $('searchInput').value = ''; $('roomFilter').value = 'all'; $('expiryFilter').value = 'all'; renderTable({ text: '', room: 'all', expiry: 'all' }); });
$('newEntryBtn').addEventListener('click', () => openForm());
$('cancelEditBtn').addEventListener('click', closeForm);
$('resetFormBtn').addEventListener('click', resetForm);
$('formPanel').addEventListener('click', (event) => { if (event.target === $('formPanel')) closeForm(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('formPanel').hidden) closeForm(); });
$('itemTableBody').addEventListener('click', async (event) => {
  const button = event.target.closest('button'); if (!button) return;
  const item = items.find((entry) => entry.id === Number(button.dataset.id)); if (!item) return;
  if (button.dataset.action === 'edit') openForm(item);
  if (button.dataset.action === 'delete' && window.confirm(`\u786e\u5b9a\u5220\u9664\u201c${item.itemName || '\u672a\u547d\u540d\u7269\u54c1'}\u201d\u5417\uff1f`)) { const previousItems = items; items = items.filter((entry) => entry.id !== item.id); try { await deleteItem(item.id); renderAll(); } catch (error) { items = previousItems; renderAll(); showDataError(error); } }
});
loadItems().then((loadedItems) => { items = loadedItems; renderAll(); }).catch((error) => { items = loadLocalItems(); renderAll(); showDataError(error); });
