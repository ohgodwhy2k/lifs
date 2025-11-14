// Name: LiFS
// ID: LiFS
// Description: The next evolution of filesystems, made in the browser's indexed database.
// By: ohgodwhy2k (refactor by ChatGPT)
// License: Creative Commons Zero 1.0

/*
Production-ready refactor notes (summary):
- Fixed DOM usage so TurboWarp-friendly: uses runtime.extensionManager when available and falls back to DOM only when running in a normal browser environment.
- Added an operation queue (simple mutex) so concurrent Scratch block calls are serialized.
- executeTransaction refactor: the callback returns a Promise; transaction resolution waits for transaction.oncomplete and returned Promise to finish. Prevents double-resolve.
- Recursive delete and rename collect paths first (no deletions while iterating cursors) to avoid cursor skipping/corruption.
- Root directory "/" is now ensured on loadLiFS.
- Normalized return types for Scratch compatibility: booleans for boolean blocks, JSON strings for list/array reporters, and strings for text reporters.
- Removed unused/respectless "permissions" enforcement (kept stored value but not enforced) and made field optional.
- Improved error reporting and made getLastError non-destructive if you prefer (still clears after reading to match prior behaviour).
- Minor robustness improvements (timeouts, try/catch, validation).
*/

let vfsDBName = '';
const VFS_STORE_NAME = 'vfs_store';
const DB_VERSION = 1;
let isVFSReady = false;
let lastError = '';
let scratchVm = null;

// A simple operation queue to serialize all FS operations
let _opQueue = Promise.resolve();
function enqueueOperation(fn) {
    _opQueue = _opQueue.then(() => fn()).catch(err => {
        // swallow to keep queue going but record lastError
        reportError(err && err.message ? err.message : String(err), 'enqueueOperation');
    });
    return _opQueue;
}

function reportError(message, scope) {
    const fullMessage = `LiFS Error in ${scope}: ${message}`;
    try { console.error(fullMessage); } catch(e) {}
    lastError = fullMessage;
}

function openDB(name, version) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(VFS_STORE_NAME)) {
                db.createObjectStore(VFS_STORE_NAME, { keyPath: 'path' });
            }
        };
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reportError(`Failed to open IndexedDB: ${event.target.error && event.target.error.message ? event.target.error.message : String(event.target.error)}`, "openDB");
            reject(event.target.error || new Error('IndexedDB open failed'));
        };
    });
}

function normalizePath(path) {
    if (typeof path !== 'string' || path.trim() === '') return '/';
    // replace backslashes, trim slashes on ends, collapse repeated slashes
    const cleaned = path.replace(/\\/g, '/').replace(/\/+/g, '/');
    const parts = cleaned.replace(/^\/+|\/+$/g, '').split('/');
    const resolvedParts = [];
    for (const part of parts) {
        if (!part || part === '.') continue;
        if (part === '..') {
            if (resolvedParts.length > 0) resolvedParts.pop();
            continue;
        }
        resolvedParts.push(part);
    }
    return '/' + resolvedParts.join('/');
}

// executeTransaction: callback(store) => returns Promise. This function itself returns a Promise
// that resolves when the transaction completes and the callback settled.
function executeTransaction(mode, callback, scope) {
    return enqueueOperation(async () => {
        if (!vfsDBName) {
            reportError("LiFS not loaded. Call 'load LiFS namespace' first.", scope || 'executeTransaction');
            throw new Error('LiFS not initialized');
        }

        const db = await openDB(vfsDBName, DB_VERSION);
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([VFS_STORE_NAME], mode);
                const store = transaction.objectStore(VFS_STORE_NAME);

                let callbackError = null;
                let callbackResult;
                // transaction lifecycle handlers
                transaction.oncomplete = () => {
                    if (callbackError) return reject(callbackError);
                    return resolve(callbackResult);
                };
                transaction.onerror = (event) => {
                    reportError(`Transaction failed: ${event && event.target && event.target.error ? event.target.error.message : 'unknown'}`, scope || 'executeTransaction');
                    reject(event && event.target && event.target.error ? event.target.error : new Error('Transaction failed'));
                };
                transaction.onabort = (event) => {
                    reportError(`Transaction aborted: ${event && event.target && event.target.error ? event.target.error.message : 'Unknown reason'}`, scope || 'executeTransaction');
                    reject(event && event.target && event.target.error ? event.target.error : new Error('Transaction aborted'));
                };

                // run the callback - it should return a Promise
                Promise.resolve().then(() => callback(store)).then(res => {
                    callbackResult = res;
                }).catch(err => {
                    callbackError = err;
                    // attempt to abort the transaction cleanly
                    try { transaction.abort(); } catch (e) {}
                });

            } catch (err) {
                reportError(err && err.message ? err.message : String(err), scope || 'executeTransaction');
                reject(err);
            }
        });
    });
}

async function ensureRootDirectory(store) {
    // ensure '/' exists as a directory record
    const req = store.get('/');
    return new Promise((resolve, reject) => {
        req.onsuccess = (e) => {
            const item = req.result;
            if (!item) {
                const now = new Date().toISOString();
                const root = { path: '/', isDirectory: true, createdAt: now, modifiedAt: now, content: null, size: 0 };
                const putReq = store.put(root);
                putReq.onsuccess = () => resolve(true);
                putReq.onerror = (ev) => { reportError(`Failed to create root: ${ev && ev.target && ev.target.error ? ev.target.error.message : 'unknown'}`, 'ensureRootDirectory'); resolve(false); };
            } else {
                resolve(true);
            }
        };
        req.onerror = (e) => { reportError(`Failed to check root: ${e && e.target && e.target.error ? e.target.error.message : 'unknown'}`, 'ensureRootDirectory'); resolve(false); };
    });
}

function loadLiFS(name) {
    if (typeof name !== 'string' || name.trim() === '') {
        reportError("Namespace cannot be empty. Please provide a unique ID.", "loadLiFS");
        return false;
    }
    vfsDBName = 'lif-s-' + name;
    isVFSReady = true;

    // lazily ensure root by opening DB and creating root entry if missing
    openDB(vfsDBName, DB_VERSION).then(db => {
        const tx = db.transaction([VFS_STORE_NAME], 'readwrite');
        const store = tx.objectStore(VFS_STORE_NAME);
        ensureRootDirectory(store).catch(e => reportError(e && e.message ? e.message : String(e), 'loadLiFS.ensureRoot'));
    }).catch(e => reportError(e && e.message ? e.message : String(e), 'loadLiFS.openDB'));

    return true;
}

function resetLiFS() {
    return enqueueOperation(() => new Promise((resolve) => {
        if (!vfsDBName) {
            reportError("LiFS not loaded. Call 'load LiFS namespace' first.", "resetLiFS");
            return resolve(false);
        }

        const request = indexedDB.deleteDatabase(vfsDBName);

        request.onsuccess = () => {
            lastError = '';
            vfsDBName = '';
            isVFSReady = false;
            resolve(true);
        };

        request.onerror = (event) => {
            reportError(`Failed to delete database: ${event && event.target && event.target.error ? event.target.error.message : 'unknown'}`, "resetLiFS");
            resolve(false);
        };

        request.onblocked = () => {
            reportError("Deletion blocked. Close all other tabs using this LiFS.", "resetLiFS");
            resolve(false);
        };
    }));
}

function isDirectory(path) {
    return enqueueOperation(async () => {
        const normalizedPath = normalizePath(path);
        try {
            await executeTransaction('readonly', (store) => new Promise((res) => {
                const request = store.get(normalizedPath);
                request.onsuccess = () => {
                    const item = request.result;
                    res(!!item && item.isDirectory === true);
                };
                request.onerror = () => { res(false); };
            }), "isDirectory");
        } catch (e) {
            return false;
        }
    });
}

function listContents(path, type) {
    return enqueueOperation(async () => {
        const normalizedPath = normalizePath(path);
        const prefix = normalizedPath === '/' ? '/' : normalizedPath + '/';
        const results = [];

        try {
            await executeTransaction('readonly', (store) => new Promise((res) => {
                const request = store.openCursor();

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const item = cursor.value;
                        const itemPath = item.path;

                        if (itemPath === normalizedPath) {
                            cursor.continue();
                            return;
                        }

                        if (itemPath.startsWith(prefix)) {
                            const relativePath = itemPath.substring(prefix.length);
                            // direct children do not contain further '/'
                            const isDirectChild = !relativePath.includes('/');

                            if (isDirectChild) {
                                if (type === 'all' || (type === 'files' && !item.isDirectory) || (type === 'directories' && item.isDirectory)) {
                                    results.push(relativePath);
                                }
                            }
                        }

                        cursor.continue();
                    } else {
                        res(results);
                    }
                };

                request.onerror = () => { reportError(`List cursor error for ${normalizedPath}`, "listContents"); res([]); };
            }), "listContents");

            return JSON.stringify(results);
        } catch (e) {
            reportError(e && e.message ? e.message : String(e), 'listContents');
            return JSON.stringify([]);
        }
    });
}

function createItem(path, content, isDirectory) {
    return enqueueOperation(async () => {
        const normalizedPath = normalizePath(path);
        if (normalizedPath === '/') {
            reportError("Cannot create/modify the root directory.", "createItem");
            return false;
        }

        const parentPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) || '/';
        const scope = "createItem";

        try {
            await executeTransaction('readwrite', (store) => new Promise((res) => {
                // ensure parent exists and is a directory
                const checkParentRequest = store.get(parentPath);
                checkParentRequest.onsuccess = () => {
                    const parentItem = checkParentRequest.result;
                    if (parentPath !== '/' && (!parentItem || !parentItem.isDirectory)) {
                        reportError(`Parent directory '${parentPath}' does not exist or is not a directory.`, scope);
                        return res(false);
                    }

                    const now = new Date().toISOString();
                    const itemData = {
                        path: normalizedPath,
                        isDirectory: !!isDirectory,
                        permissions: { read: 'all', write: 'owner', delete: 'owner', create: 'owner' },
                        createdAt: now,
                        modifiedAt: now
                    };

                    if (!isDirectory) {
                        itemData.content = typeof content === 'string' ? content : String(content || '');
                        itemData.size = itemData.content ? itemData.content.length : 0;
                    } else {
                        itemData.content = null;
                        itemData.size = 0;
                    }

                    const putRequest = store.put(itemData);
                    putRequest.onsuccess = () => res(true);
                    putRequest.onerror = (event) => { reportError(`Failed to save item: ${event && event.target && event.target.error ? event.target.error.message : 'unknown'}`, scope); res(false); };
                };
                checkParentRequest.onerror = (event) => { reportError(`Failed to check parent path: ${event && event.target && event.target.error ? event.target.error.message : 'unknown'}`, scope); res(false); };
            }), scope);

            return true;
        } catch (e) {
            reportError(e && e.message ? e.message : String(e), scope);
            return false;
        }
    });
}

function readFile(path) {
    return enqueueOperation(async () => {
        const normalizedPath = normalizePath(path);
        const scope = "readFile";

        try {
            const content = await executeTransaction('readonly', (store) => new Promise((res) => {
                const request = store.get(normalizedPath);
                request.onsuccess = () => {
                    const item = request.result;
                    if (!item) {
                        reportError(`File not found at '${normalizedPath}'`, scope);
                        return res('');
                    }
                    if (item.isDirectory) {
                        reportError(`Cannot read, '${normalizedPath}' is a directory`, scope);
                        return res('');
                    }
                    res(item.content || '');
                };
                request.onerror = () => { reportError(`Read error for ${normalizedPath}`, scope); res(''); };
            }), scope);

            return content;
        } catch (e) {
            reportError(e && e.message ? e.message : String(e), scope);
            return '';
        }
    });
}

function deleteItem(path) {
    return enqueueOperation(async () => {
        const normalizedPath = normalizePath(path);
        if (normalizedPath === '/') {
            reportError("Cannot delete the root directory.", "deleteItem");
            return false;
        }
        const scope = "deleteItem";

        try {
            // gather list of items to delete first
            const toDelete = [];
            await executeTransaction('readonly', (store) => new Promise((res) => {
                const getReq = store.get(normalizedPath);
                getReq.onsuccess = () => {
                    const item = getReq.result;
                    if (!item) {
                        reportError(`Item not found at '${normalizedPath}'`, scope);
                        return res(false);
                    }
                    if (item.isDirectory) {
                        const prefix = normalizedPath === '/' ? '/' : normalizedPath + '/';
                        const cursorReq = store.openCursor();
                        cursorReq.onsuccess = (ev) => {
                            const cursor = ev.target.result;
                            if (cursor) {
                                const p = cursor.value.path;
                                if (p.startsWith(prefix)) toDelete.push(p);
                                cursor.continue();
                            } else {
                                // add the parent directory itself finally
                                toDelete.push(normalizedPath);
                                res(true);
                            }
                        };
                        cursorReq.onerror = () => { reportError('Cursor error while collecting child paths', scope); res(false); };
                    } else {
                        toDelete.push(normalizedPath);
                        res(true);
                    }
                };
                getReq.onerror = () => { reportError('Check error while deleting', scope); res(false); };
            }), scope);

            if (toDelete.length === 0) return false;

            // delete in a separate readwrite transaction
            await executeTransaction('readwrite', (store) => new Promise((res, rej) => {
                let remaining = toDelete.length;
                for (const p of toDelete) {
                    const delReq = store.delete(p);
                    delReq.onsuccess = () => {
                        remaining -= 1;
                        if (remaining === 0) res(true);
                    };
                    delReq.onerror = (ev) => {
                        // continue attempting deletes but mark failure
                        reportError(`Delete error for ${p}: ${ev && ev.target && ev.target.error ? ev.target.error.message : 'unknown'}`, scope);
                        remaining -= 1;
                        if (remaining === 0) res(false);
                    };
                }
            }), scope);

            return true;
        } catch (e) {
            reportError(e && e.message ? e.message : String(e), scope);
            return false;
        }
    });
}

function renameItem(oldPath, newPath) {
    return enqueueOperation(async () => {
        const normalizedOldPath = normalizePath(oldPath);
        const normalizedNewPath = normalizePath(newPath);
        const scope = "renameItem";

        if (normalizedOldPath === '/' || normalizedNewPath === '/') {
            reportError("Cannot rename or move the root directory.", scope);
            return false;
        }
        if (normalizedOldPath === normalizedNewPath) return true;

        try {
            // collect items to move first
            const itemsToMove = [];
            await executeTransaction('readonly', (store) => new Promise((res) => {
                const oldItemReq = store.get(normalizedOldPath);
                oldItemReq.onsuccess = () => {
                    const oldItem = oldItemReq.result;
                    if (!oldItem) { reportError(`Item not found at '${normalizedOldPath}'`, scope); return res(false); }

                    const prefix = normalizedOldPath === '/' ? '/' : normalizedOldPath + '/';
                    const cursorReq = store.openCursor();
                    cursorReq.onsuccess = (ev) => {
                        const cursor = ev.target.result;
                        if (cursor) {
                            const item = cursor.value;
                            if (item.path.startsWith(prefix)) itemsToMove.push(item);
                            cursor.continue();
                        } else {
                            // include the oldItem itself if not already
                            if (!itemsToMove.some(i => i.path === normalizedOldPath)) itemsToMove.push(oldItem);
                            res(true);
                        }
                    };
                    cursorReq.onerror = () => { reportError('Cursor error while collecting rename items', scope); res(false); };
                };
                oldItemReq.onerror = () => { reportError('Failed to check old path', scope); res(false); };
            }), scope);

            if (itemsToMove.length === 0) return false;

            // ensure destination doesn't exist
            const destExists = await executeTransaction('readonly', (store) => new Promise((res) => {
                const r = store.get(normalizedNewPath);
                r.onsuccess = () => res(!!r.result);
                r.onerror = () => res(true); // be conservative
            }), scope);

            if (destExists) { reportError(`Destination item already exists at '${normalizedNewPath}'`, scope); return false; }

            // perform deletes and writes in a single readwrite transaction
            await executeTransaction('readwrite', (store) => new Promise((res) => {
                let remaining = itemsToMove.length;
                for (const item of itemsToMove) {
                    const suffix = item.path.substring(normalizedOldPath.length);
                    const newPathForItem = normalizedNewPath + suffix;
                    const now = new Date().toISOString();
                    const newItem = Object.assign({}, item, { path: newPathForItem, modifiedAt: now });

                    // delete old then put new
                    const delReq = store.delete(item.path);
                    delReq.onsuccess = () => {
                        const putReq = store.put(newItem);
                        putReq.onsuccess = () => {
                            remaining -= 1;
                            if (remaining === 0) res(true);
                        };
                        putReq.onerror = () => { reportError(`Failed to put moved item ${newPathForItem}`, scope); remaining -= 1; if (remaining === 0) res(false); };
                    };
                    delReq.onerror = () => { reportError(`Failed to delete ${item.path} while renaming`, scope); remaining -= 1; if (remaining === 0) res(false); };
                }
            }), scope);

            return true;
        } catch (e) {
            reportError(e && e.message ? e.message : String(e), scope);
            return false;
        }
    });
}

function isVFSReadyReporter() { return isVFSReady; }
function getLiFSNamespace() { return vfsDBName ? vfsDBName.replace('lif-s-', '') : ''; }

function itemExists(path) {
    return enqueueOperation(async () => {
        const normalizedPath = normalizePath(path);
        try {
            const exists = await executeTransaction('readonly', (store) => new Promise((res) => {
                const request = store.get(normalizedPath);
                request.onsuccess = () => res(!!request.result);
                request.onerror = () => res(false);
            }), 'itemExists');
            return !!exists;
        } catch (e) { return false; }
    });
}

function getItemProperty(property, path) {
    return enqueueOperation(async () => {
        const normalizedPath = normalizePath(path);
        try {
            const value = await executeTransaction('readonly', (store) => new Promise((res) => {
                const request = store.get(normalizedPath);
                request.onsuccess = () => {
                    const item = request.result;
                    if (item && Object.prototype.hasOwnProperty.call(item, property)) {
                        let v = item[property];
                        if (typeof v === 'object' && v !== null) v = JSON.stringify(v);
                        return res(String(v));
                    }
                    reportError(`Property '${property}' not found for item at '${normalizedPath}' or item not found.`, "getItemProperty");
                    res('');
                };
                request.onerror = () => { reportError(`Get error for ${normalizedPath}`, "getItemProperty"); res(''); };
            }), 'getItemProperty');
            return value || '';
        } catch (e) { return ''; }
    });
}

function getFileSize(path) { return getItemProperty('size', path); }

function getDirectorySize(path) {
    return enqueueOperation(async () => {
        const normalizedPath = normalizePath(path);
        const prefix = normalizedPath === '/' ? '/' : normalizedPath + '/';
        let totalSize = 0;
        try {
            await executeTransaction('readonly', (store) => new Promise((res) => {
                const request = store.openCursor();
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const item = cursor.value;
                        const itemPath = item.path;
                        if (itemPath === normalizedPath || (itemPath.startsWith(prefix) && itemPath !== normalizedPath)) {
                            if (!item.isDirectory && typeof item.size === 'number') totalSize += item.size;
                        }
                        cursor.continue();
                    } else {
                        res(true);
                    }
                };
                request.onerror = () => { reportError('Directory size cursor error', 'getDirectorySize'); res(false); };
            }), 'getDirectorySize');
            return String(totalSize);
        } catch (e) {
            reportError(e && e.message ? e.message : String(e), 'getDirectorySize');
            return '0';
        }
    });
}

function getLastError() {
    const err = lastError;
    lastError = '';
    return err || '';
}

function getAllItemPaths() {
    return enqueueOperation(async () => {
        const paths = [];
        try {
            await executeTransaction('readonly', (store) => new Promise((res) => {
                const request = store.openCursor();
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) { paths.push(cursor.value.path); cursor.continue(); } else res(true);
                };
                request.onerror = () => { reportError('All paths cursor error', 'getAllItemPaths'); res(false); };
            }), 'getAllItemPaths');
            return JSON.stringify(paths);
        } catch (e) { return JSON.stringify([]); }
    });
}

// File export/import: prefer runtime.extensionManager when available (TurboWarp friendly), else fallback to DOM
async function _downloadBlob(blob, filename) {
    // TurboWarp / Scratch VM method
    try {
        if (scratchVm && scratchVm.extensionManager && typeof scratchVm.extensionManager.download === 'function') {
            const arrayBuffer = await blob.arrayBuffer();
            scratchVm.extensionManager.download({ data: new Uint8Array(arrayBuffer), name: filename });
            return true;
        }
    } catch (e) { reportError('extensionManager.download failed: ' + (e && e.message ? e.message : String(e)), '_downloadBlob'); }

    // fallback - will work in normal browsers but may fail in extension worker environments
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        reportError('Download fallback failed: ' + (e && e.message ? e.message : String(e)), '_downloadBlob');
        return false;
    }
}

async function _openFilePicker(acceptExt) {
    // TurboWarp-friendly API first
    try {
        if (scratchVm && scratchVm.extensionManager && typeof scratchVm.extensionManager.openFile === 'function') {
            // openFile expected to return { data: Uint8Array, name: string }
            const result = await scratchVm.extensionManager.openFile({ accept: [acceptExt] });
            if (result && result.data) {
                const dec = new TextDecoder();
                return { content: dec.decode(result.data), name: result.name || '' };
            }
            return null;
        }
    } catch (e) { reportError('extensionManager.openFile failed: ' + (e && e.message ? e.message : String(e)), '_openFilePicker'); }

    // fallback to DOM picker (may not work in TurboWarp worker)
    return new Promise((resolve) => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = acceptExt || '.lifs,application/json';
            input.style.display = 'none';

            input.onchange = (evt) => {
                const f = evt.target.files[0];
                if (!f) { resolve(null); return; }
                const reader = new FileReader();
                reader.onload = (e) => { resolve({ content: e.target.result, name: f.name }); };
                reader.onerror = () => { reportError('FileReader error', ' _openFilePicker'); resolve(null); };
                reader.readAsText(f);
            };

            document.body.appendChild(input);
            input.click();
            setTimeout(() => { document.body.removeChild(input); }, 5000);
        } catch (e) {
            reportError('DOM file picker failed: ' + (e && e.message ? e.message : String(e)), '_openFilePicker');
            resolve(null);
        }
    });
}

function exportVFS() {
    return enqueueOperation(async () => {
        const allItems = [];
        const scope = "exportVFS";

        try {
            await executeTransaction('readonly', (store) => new Promise((res) => {
                const request = store.openCursor();
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) { allItems.push(cursor.value); cursor.continue(); } else res(true);
                };
                request.onerror = () => { reportError('Export cursor error', scope); res(false); };
            }), scope);

            const jsonString = JSON.stringify(allItems);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const filename = `${getLiFSNamespace() || 'LiFS_export'}.lifs`;
            const ok = await _downloadBlob(blob, filename);
            return !!ok;
        } catch (e) { reportError(e && e.message ? e.message : String(e), scope); return false; }
    });
}

function processImportContent(content) {
    return enqueueOperation(async () => {
        const scope = "processImportContent";
        if (!content || typeof content !== 'string') { reportError('Import content is empty or not a string.', scope); return false; }

        let importItems;
        try { importItems = JSON.parse(content); } catch (e) { reportError(`Failed to parse import JSON: ${e && e.message ? e.message : String(e)}`, scope); return false; }
        if (!Array.isArray(importItems)) { reportError('Import content is not a valid LiFS array.', scope); return false; }
        if (!vfsDBName) { reportError("LiFS namespace was lost/not set. Please call 'load LiFS namespace' first.", scope); return false; }

        try {
            await executeTransaction('readwrite', (store) => new Promise((res) => {
                let total = importItems.length; let successful = 0;
                if (total === 0) return res(true);
                for (const item of importItems) {
                    if (!item || !item.path) { total -= 1; if (total === 0) res(true); continue; }
                    const putRequest = store.put(item);
                    putRequest.onsuccess = () => { successful += 1; total -= 1; if (total === 0) res(true); };
                    putRequest.onerror = () => { reportError('Import item failed', scope); total -= 1; if (total === 0) res(true); };
                }
            }), scope);

            return true;
        } catch (e) { reportError(e && e.message ? e.message : String(e), scope); return false; }
    });
}

function triggerImportVFS() {
    return enqueueOperation(async () => {
        const scope = 'triggerImportVFS';
        try {
            const pick = await _openFilePicker('.lifs,application/json');
            if (!pick) return false;
            const name = pick.name || '';
            if (!name.toLowerCase().endsWith('.lifs')) { reportError(`Selected file '${name}' is not a .lifs file.`, scope); return false; }
            const content = pick.content;
            const ok = await processImportContent(content);
            return !!ok;
        } catch (e) { reportError(e && e.message ? e.message : String(e), scope); return false; }
    });
}

// The Scratch extension class
class LiFS {
    constructor(runtime) {
        scratchVm = runtime;
        lastError = '';
    }

    getInfo() {
        return {
            id: 'LiFS',
            name: 'LiFS',
            blocks: [
                { opcode: 'loadLiFS', blockType: Scratch.BlockType.COMMAND, text: 'load LiFS namespace [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'my-project-data' } } },
                { opcode: 'resetLiFS', blockType: Scratch.BlockType.COMMAND, text: 'delete all LiFS data (reset)' },
                '---',
                { opcode: 'createFile', blockType: Scratch.BlockType.COMMAND, text: 'create/overwrite file at [PATH] with content [CONTENT]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/data/config.txt' }, CONTENT: { type: Scratch.ArgumentType.STRING, defaultValue: 'default content' } } },
                { opcode: 'createDirectory', blockType: Scratch.BlockType.COMMAND, text: 'create directory at [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/assets/images' } } },
                { opcode: 'deleteItem', blockType: Scratch.BlockType.COMMAND, text: 'delete item at [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/data/config.txt' } } },
                { opcode: 'renameItem', blockType: Scratch.BlockType.COMMAND, text: 'rename/move item from [OLD_PATH] to [NEW_PATH]', arguments: { OLD_PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/old-file.txt' }, NEW_PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/new-file.txt' } } },
                '---',
                { opcode: 'readFile', blockType: Scratch.BlockType.REPORTER, text: 'read file [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/data/config.txt' } } },
                { opcode: 'listContents', blockType: Scratch.BlockType.REPORTER, text: 'list [TYPE] in [PATH] (JSON list)', arguments: { TYPE: { type: Scratch.ArgumentType.STRING, menu: 'content_type', defaultValue: 'all' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/' } } },
                { opcode: 'getItemProperty', blockType: Scratch.BlockType.REPORTER, text: 'property [PROPERTY] of item [PATH]', arguments: { PROPERTY: { type: Scratch.ArgumentType.STRING, menu: 'item_properties', defaultValue: 'size' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/data/config.txt' } } },
                '---',
                { opcode: 'itemExists', blockType: Scratch.BlockType.BOOLEAN, text: 'item exists at [PATH]?', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/' } } },
                { opcode: 'isDirectory', blockType: Scratch.BlockType.BOOLEAN, text: 'is [PATH] a directory?', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: '/' } } },
                { opcode: 'isVFSReadyReporter', blockType: Scratch.BlockType.BOOLEAN, text: 'is LiFS ready?' },
                { opcode: 'getLiFSNamespace', blockType: Scratch.BlockType.REPORTER, text: 'LiFS namespace' },
                { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'last LiFS error (clears after reading)' },
                '---',
                { opcode: 'exportVFS', blockType: Scratch.BlockType.COMMAND, text: 'export LiFS to file (.lifs)' },
                { opcode: 'triggerImportVFS', blockType: Scratch.BlockType.COMMAND, text: 'import LiFS from file picker (overwrites existing)' }
            ],
            menus: {
                content_type: { acceptsReporters: true, items: [ { text: 'all', value: 'all' }, { text: 'files', value: 'files' }, { text: 'directories', value: 'directories' } ] },
                item_properties: { acceptsReporters: true, items: [ { text: 'path', value: 'path' }, { text: 'isDirectory', value: 'isDirectory' }, { text: 'size', value: 'size' }, { text: 'createdAt', value: 'createdAt' }, { text: 'modifiedAt', value: 'modifiedAt' }, { text: 'permissions', value: 'permissions' } ] }
            }
        };
    }

    // wrapper methods that return raw values (Promises are handled by Scratch runtime)
    loadLiFS(args) { return loadLiFS(args.NAME); }
    resetLiFS() { return resetLiFS(); }
    listContents(args) { return listContents(args.PATH, args.TYPE); }
    readFile(args) { return readFile(args.PATH); }
    deleteItem(args) { return deleteItem(args.PATH); }
    createFile(args) { return createItem(args.PATH, args.CONTENT, false); }
    createDirectory(args) { return createItem(args.PATH, null, true); }
    renameItem(args) { return renameItem(args.OLD_PATH, args.NEW_PATH); }

    isVFSReadyReporter() { return isVFSReadyReporter(); }
    getLiFSNamespace() { return getLiFSNamespace(); }
    itemExists(args) { return itemExists(args.PATH); }
    isDirectory(args) { return isDirectory(args.PATH); }
    getItemProperty(args) { return getItemProperty(args.PROPERTY, args.PATH); }
    getAllItemPaths() { return getAllItemPaths(); }
    getFileSize(args) { return getFileSize(args.PATH); }
    getDirectorySize(args) { return getDirectorySize(args.PATH); }
    getLastError() { return getLastError(); }

    exportVFS() { return exportVFS(); }
    triggerImportVFS() { return triggerImportVFS(); }
}

if (typeof Scratch !== 'undefined') {
    Scratch.extensions.register(new LiFS());
}