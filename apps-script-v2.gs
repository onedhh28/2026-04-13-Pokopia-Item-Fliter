const SHEET_NAME_ITEMS = 'items';
const SHEET_NAME_POKES = 'pokemon';
const ADMIN_PASSWORD = 'admin123';

function doGet(e) {
  const action = e.parameter.action;
  let result;
  try {
    if (action === 'getAll') result = getAll();
    else if (action === 'saveItem') result = saveItem(JSON.parse(e.parameter.item), e.parameter.pw);
    else if (action === 'deleteItem') result = deleteItem(e.parameter.id, e.parameter.pw);
    else if (action === 'savePoke') result = savePoke(JSON.parse(e.parameter.poke), e.parameter.oldName, e.parameter.pw);
    else if (action === 'deletePoke') result = deletePoke(e.parameter.name, e.parameter.pw);
    else result = { error: 'unknown action' };
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkPw(pw) {
  if (pw !== ADMIN_PASSWORD) throw new Error('密碼錯誤');
}

function getAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const itemSheet = ss.getSheetByName(SHEET_NAME_ITEMS);
  const pokeSheet = ss.getSheetByName(SHEET_NAME_POKES);

  const itemRows = itemSheet.getDataRange().getValues();
  const pokeRows = pokeSheet.getDataRange().getValues();

  const items = itemRows.slice(1).filter(r => r[0]).map(r => ({
    id: r[0],
    name: r[1],
    base: r[2] === '' || r[2] === '-' ? null : Number(r[2]),
    kind: r[3],
    craftable: r[4] === true || r[4] === 'TRUE' || r[4] === '是',
    mat: r[5] || '',
    prices: r[6] ? JSON.parse(r[6]) : {}
  }));

  const pokes = pokeRows.slice(1).filter(r => r[0]).map(r => ({
    name: r[0],
    types: r[1] ? r[1].split(',').map(s => s.trim()) : ['一般'],
    colors: r[2] ? r[2].split(',').map(s => s.trim()) : ['#a0a0a0']
  }));

  return { items, pokes };
}

function saveItem(item, pw) {
  checkPw(pw);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ITEMS);
  const data = sheet.getDataRange().getValues();

  const row = [
    item.id,
    item.name,
    item.base === null ? '' : item.base,
    item.kind,
    item.craftable ? '是' : '否',
    item.mat || '',
    JSON.stringify(item.prices || {})
  ];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(item.id)) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return { ok: true, action: 'updated' };
    }
  }
  const maxId = data.slice(1).reduce((m, r) => Math.max(m, Number(r[0]) || 0), 0);
  row[0] = maxId + 1;
  sheet.appendRow(row);
  return { ok: true, action: 'created', id: row[0] };
}

function deleteItem(id, pw) {
  checkPw(pw);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ITEMS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { error: '找不到該物品' };
}

function savePoke(poke, oldName, pw) {
  checkPw(pw);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_POKES);
  const data = sheet.getDataRange().getValues();
  const row = [poke.name, poke.types.join(','), poke.colors.join(',')];
  const lookupName = oldName || poke.name;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === lookupName) {
      sheet.getRange(i + 1, 1, 1, 3).setValues([row]);
      if (oldName && oldName !== poke.name) renamePokeInItems(oldName, poke.name);
      return { ok: true, action: 'updated' };
    }
  }
  sheet.appendRow(row);
  return { ok: true, action: 'created' };
}

function deletePoke(name, pw) {
  checkPw(pw);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_POKES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      sheet.deleteRow(i + 1);
      removePokeFromItems(name);
      return { ok: true };
    }
  }
  return { error: '找不到該寶可夢' };
}

function renamePokeInItems(oldName, newName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ITEMS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (!data[i][6]) continue;
    try {
      const prices = JSON.parse(data[i][6]);
      if (oldName in prices) {
        prices[newName] = prices[oldName];
        delete prices[oldName];
        sheet.getRange(i + 1, 7).setValue(JSON.stringify(prices));
      }
    } catch (e) {}
  }
}

function removePokeFromItems(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_ITEMS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (!data[i][6]) continue;
    try {
      const prices = JSON.parse(data[i][6]);
      if (name in prices) {
        delete prices[name];
        sheet.getRange(i + 1, 7).setValue(JSON.stringify(prices));
      }
    } catch (e) {}
  }
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let itemSheet = ss.getSheetByName(SHEET_NAME_ITEMS);
  if (!itemSheet) itemSheet = ss.insertSheet(SHEET_NAME_ITEMS);
  itemSheet.getRange(1, 1, 1, 7).setValues([['id','name','base','kind','craftable','mat','prices_json']]);
  let pokeSheet = ss.getSheetByName(SHEET_NAME_POKES);
  if (!pokeSheet) pokeSheet = ss.insertSheet(SHEET_NAME_POKES);
  pokeSheet.getRange(1, 1, 1, 3).setValues([['name','types','colors']]);
  SpreadsheetApp.getUi().alert('試算表結構建立完成！');
}
