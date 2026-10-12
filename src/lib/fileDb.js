// Tiny IndexedDB wrapper for storing uploaded files in the browser.
const DB_NAME = "qa-hub-files";
const STORE = "files";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const putFile = (key, blob) => run("readwrite", (s) => s.put(blob, key));
export const getFile = (key) => run("readonly", (s) => s.get(key));
export const clearFiles = () => run("readwrite", (s) => s.clear());
