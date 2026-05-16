const DB_NAME = 'instify-wa';
const DB_VER = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('chats'))
        db.createObjectStore('chats', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('messages'))
        db.createObjectStore('messages', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('outbox'))
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export async function saveChats(instituteId, chats) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chats', 'readwrite');
    tx.objectStore('chats').put({ key: `chats_${instituteId}`, data: chats, ts: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

export async function loadChatsCache(instituteId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('chats', 'readonly').objectStore('chats').get(`chats_${instituteId}`);
    req.onsuccess = e => resolve(e.target.result?.data || null);
    req.onerror = e => reject(e.target.error);
  });
}

export async function saveMessages(instituteId, jid, messages) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    tx.objectStore('messages').put({ key: `msgs_${instituteId}_${jid}`, data: messages, ts: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

export async function loadMessagesCache(instituteId, jid) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('messages', 'readonly').objectStore('messages').get(`msgs_${instituteId}_${jid}`);
    req.onsuccess = e => resolve(e.target.result?.data || null);
    req.onerror = e => reject(e.target.error);
  });
}

export async function addToOutbox(payload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    const req = tx.objectStore('outbox').add({ ...payload, ts: Date.now() });
    req.onsuccess = e => resolve(e.target.result);
    tx.onerror = e => reject(e.target.error);
  });
}

export async function getOutbox() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('outbox', 'readonly').objectStore('outbox').getAll();
    req.onsuccess = e => resolve(e.target.result || []);
    req.onerror = e => reject(e.target.error);
  });
}

export async function removeFromOutbox(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').delete(id);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}
