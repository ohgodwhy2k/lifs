// Name: LiFS
// ID: LiFS
// Description: The next evolution of filesystems, made in the browser's indexed database.
// By: ohgodwhy2k (refactor by ChatGPT)
// License: Creative Commons Zero 1.0

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
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => {
            reportError(`Failed to open IndexedDB: ${event.target.error?.message || event.target.error}`, "openDB");
            reject(event.target.error || new Error('IndexedDB open failed'));
        };
    });
}

function normalizePath(path) {
    if (typeof path !== 'string' || path.trim() === '') return '/';
    const cleaned = path.replace(/\\/g, '/').replace(/\/+/g, '/');
    const parts = cleaned.replace(/^\/+|\/+$/g, '').split('/');
    const resolvedParts = [];
    for (const part of parts) {
        if (!part || part === '.') continue;
        if (part === '..') { if (resolvedParts.length > 0) resolvedParts.pop(); continue; }
        resolvedParts.push(part);
    }
    return '/' + resolvedParts.join('/');
}

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

                transaction.oncomplete = () => { callbackError ? reject(callbackError) : resolve(callbackResult); };
                transaction.onerror = (event) => {
                    reportError(`Transaction failed: ${event?.target?.error?.message || 'unknown'}`, scope || 'executeTransaction');
                    reject(event?.target?.error || new Error('Transaction failed'));
                };
                transaction.onabort = (event) => {
                    reportError(`Transaction aborted: ${event?.target?.error?.message || 'Unknown reason'}`, scope || 'executeTransaction');
                    reject(event?.target?.error || new Error('Transaction aborted'));
                };

                Promise.resolve().then(() => callback(store)).then(res => { callbackResult = res; }).catch(err => {
                    callbackError = err;
                    try { transaction.abort(); } catch(e) {}
                });
            } catch (err) {
                reportError(err?.message || String(err), scope || 'executeTransaction');
                reject(err);
            }
        });
    });
}

async function ensureRootDirectory(store) {
    const req = store.get('/');
    return new Promise((resolve) => {
        req.onsuccess = () => {
            if (!req.result) {
                const now = new Date().toISOString();
                const root = { path: '/', isDirectory: true, createdAt: now, modifiedAt: now, content: null, size: 0 };
                const putReq = store.put(root);
                putReq.onsuccess = () => resolve(true);
                putReq.onerror = (ev) => { reportError(`Failed to create root: ${ev?.target?.error?.message || 'unknown'}`, 'ensureRootDirectory'); resolve(false); };
            } else resolve(true);
        };
        req.onerror = () => { reportError(`Failed to check root: ${req?.error?.message || 'unknown'}`, 'ensureRootDirectory'); resolve(false); };
    });
}

function loadLiFS(name) {
    if (typeof name !== 'string' || name.trim() === '') {
        reportError("Namespace cannot be empty. Please provide a unique ID.", "loadLiFS");
        return false;
    }
    vfsDBName = 'lif-s-' + name;
    isVFSReady = true;

    openDB(vfsDBName, DB_VERSION).then(db => {
        const tx = db.transaction([VFS_STORE_NAME], 'readwrite');
        const store = tx.objectStore(VFS_STORE_NAME);
        ensureRootDirectory(store).catch(e => reportError(e?.message || String(e), 'loadLiFS.ensureRoot'));
    }).catch(e => reportError(e?.message || String(e), 'loadLiFS.openDB'));

    return true;
}

function resetLiFS() {
    return enqueueOperation(() => new Promise((resolve) => {
        if (!vfsDBName) { reportError("LiFS not loaded. Call 'load LiFS namespace' first.", "resetLiFS"); return resolve(false); }
        const request = indexedDB.deleteDatabase(vfsDBName);

        request.onsuccess = () => { lastError = ''; vfsDBName = ''; isVFSReady = false; resolve(true); };
        request.onerror = (event) => { reportError(`Failed to delete database: ${event?.target?.error?.message || 'unknown'}`, "resetLiFS"); resolve(false); };
        request.onblocked = () => { reportError("Deletion blocked. Close all other tabs using this LiFS.", "resetLiFS"); resolve(false); };
    }));
}

// ... [All the createItem, readFile, deleteItem, renameItem, listContents, getItemProperty, getFileSize, getDirectorySize, getAllItemPaths, itemExists functions remain unchanged, omitted here for brevity] ...

// Patched _openFilePicker with DOM fallback fix
async function _openFilePicker(acceptExt) {
    try {
        if (scratchVm?.extensionManager?.openFile) {
            const result = await scratchVm.extensionManager.openFile({ accept: [acceptExt] });
            if (result?.data) {
                const dec = new TextDecoder();
                return { content: dec.decode(result.data), name: result.name || '' };
            }
            return null;
        }
    } catch (e) { reportError('extensionManager.openFile failed: ' + (e?.message || String(e)), '_openFilePicker'); }

    return new Promise((resolve) => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = acceptExt || '.lifs,application/json';
            input.style.display = 'none';

            let resolved = false;
            function safeResolve(value) { if (!resolved) { resolved = true; resolve(value); } }

            input.onchange = (evt) => {
                const f = evt.target.files[0];
                if (!f) return safeResolve(null);
                const reader = new FileReader();
                reader.onload = (e) => safeResolve({ content: e.target.result, name: f.name });
                reader.onerror = () => { reportError('FileReader error', '_openFilePicker'); safeResolve(null); };
                reader.readAsText(f);
            };

            input.onblur = () => { setTimeout(() => safeResolve(null), 50); };
            setTimeout(() => safeResolve(null), 3000);

            document.body.appendChild(input);
            input.click();
            setTimeout(() => { document.body.removeChild(input); }, 5000);

        } catch (e) { reportError('DOM file picker failed: ' + (e?.message || String(e)), '_openFilePicker'); resolve(null); }
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
            return !!await processImportContent(content);
        } catch (e) { reportError(e?.message || String(e), scope); return false; }
    });
}

// LiFS class with Scratch registration remains unchanged
class LiFS {
    constructor(runtime) { scratchVm = runtime; lastError = ''; }
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
