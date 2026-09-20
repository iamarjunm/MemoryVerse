const DATABASE_NAME = 'memoryverse-media';
const STORE_NAME = 'files';

function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaFile(file: File): Promise<string> {
  const id = `media_${crypto.randomUUID()}`;
  const database = await openMediaDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
  return id;
}

export async function loadMediaUrl(id: string): Promise<string | null> {
  const database = await openMediaDatabase();
  const file = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();

  return file ? URL.createObjectURL(file) : null;
}

export async function deleteMediaFile(id: string): Promise<void> {
  const database = await openMediaDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}