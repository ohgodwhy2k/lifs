![enter image description here](https://raw.githubusercontent.com/ohgodwhy2k/lifs/refs/heads/main/docs/mdbanner.png)

# Intro to LiFS

**LiFS** (Live Indexed File System) is the next evolution of in-browser virtual file storage for TurboWarp and Scratch projects. Built on top of the browser's high-capacity **IndexedDB**, LiFS provides a **robust, persistent, and production-ready** environment for saving and managing user data, complex game states, and assets with real-time stability.

## LiFS vs. rxFS

LiFS is designed as a more stable, feature-rich, and faster replacement for older file system extensions like rxFS. It focuses heavily on data integrity and compatibility with TurboWarp's advanced environment. 

| Feature | LiFS Advantage | Impact on Projects |
| :--- | :--- | :--- |
| **Concurrency** | Uses an **Operation Queue** to serialize all FS requests. | Eliminates data corruption and race conditions from rapidly firing blocks. |
| **Integrity** | Advanced Transaction logic waits for **IndexedDB and Block completion**. | Ensures data is written/deleted completely before the next block executes. |
| **Path Safety** | Includes a robust `normalizePath` function. | Correctly handles paths like `/folder//sub/../file.txt` for consistent results. |
| **Export/Import** | Utilizes **TurboWarp's `extensionManager` API** first. | Guarantees file saving/loading works reliably, even in Web Worker environments. |
| **Recursive Ops** | `Delete` and `Rename/Move` safely identify all affected child paths **before** executing. | Reliable deletion and moving of large folders without data loss or transaction failure. |
| **Root Protection** | The root directory (`/`) is automatically ensured and cannot be deleted or renamed. | Prevents critical, project-breaking errors. |

---

## Block Reference

All file paths in LiFS are absolute, starting with a forward slash (`/`), and use a standard UNIX-style path structure (e.g., `/my-folder/data.txt`).

### 1. Initialization and Setup

These blocks control the connection to the underlying IndexedDB database.

| Block | Description |
| :--- | :--- |
| **`load LiFS namespace [NAME]`** | **(MANDATORY)** Initializes the file system using a unique name (e.g., `my-project-data`). This creates or opens a dedicated, persistent database for your project. |
| **`delete all LiFS data (reset)`** | **(DANGEROUS)** Permanently deletes the entire LiFS database associated with the current namespace. Requires `load LiFS` to be called again to re-initialize. |
| **`is LiFS ready?`** | Returns `true` once the connection to the IndexedDB has been established and the root directory is ready. **All FS operations should wait for this to be `true`**. |
| **`LiFS namespace`** | Reporter block that returns the currently loaded namespace name (e.g., `my-project-data`). |

### 2. File and Directory Operations

These blocks allow you to create, modify, and manage the file structure.

| Block | Description |
| :--- | :--- |
| **`create/overwrite file at [PATH] with content [CONTENT]`** | Creates a new file at the specified path or overwrites an existing file. **The parent directory must already exist.** |
| **`create directory at [PATH]`** | Creates a new directory (folder). Parent directories must exist (e.g., to create `/a/b/c`, `/a/b` must exist first). |
| **`delete item at [PATH]`** | Deletes a file OR a directory. If the path is a directory, it **recursively deletes all contents** within it safely. Cannot delete the root `/`. |
| **`rename/move item from [OLD_PATH] to [NEW_PATH]`** | Renames a file/folder or moves it to a new location. If moving a directory, **all sub-items are automatically updated** with the new path prefix. |

### 3. Reporting and Utility

Use these blocks to retrieve data and inspect the file system's status.

| Block | Type | Description |
| :--- | :--- | :--- |
| **`read file [PATH]`** | Reporter | Returns the stored content (as a string) of the file at the path. Returns an empty string if the file doesn't exist or the path is a directory. |
| **`list [TYPE] in [PATH] (JSON list)`** | Reporter | Lists the **direct children** of the directory at `PATH`. Returns a **JSON string array** of names (e.g., `["file.txt", "assets"]`). `[TYPE]` can be `all`, `files`, or `directories`. |
| **`item exists at [PATH]?`** | Boolean | Returns `true` if a file or directory exists at the specified path. |
| **`is [PATH] a directory?`** | Boolean | Returns `true` if the path corresponds to a directory (folder). |
| **`property [PROPERTY] of item [PATH]`** | Reporter | Returns a specific property of the item. Useful properties include: **`size`**, **`createdAt`**, **`modifiedAt`**, **`isDirectory`**. |
| **`last LiFS error (clears after reading)`**| Reporter | Returns a string detailing the last error encountered by any LiFS operation (e.g., failed deletion, transaction abort, item not found). **The error message is cleared after this block is executed.** |

### 4. Backup and Migration (Import/Export)

These blocks allow users to back up their data or transfer data between projects.

| Block | Description |
| :--- | :--- |
| **`export LiFS to file (.lifs)`** | Downloads a single `.lifs` file (a JSON representation of the entire virtual file system) to the user's computer. |
| **`import LiFS from file picker (overwrites existing)`** | Opens a file picker, allowing the user to select a `.lifs` file. The contents of the imported file will be merged with/overwrite any existing items in the current LiFS namespace. |

## Advanced Path Normalization

LiFS includes robust path handling to prevent errors. You do not need to worry about extra slashes or relative syntax:

| User Input | LiFS Normalized Path |
| :--- | :--- |
| `MyFolder/file.txt` | `/MyFolder/file.txt` |
| `/assets//images/` | `/assets/images` |
| `/data/backup/../live.sav` | `/data/live.sav` |
| `../../project.json` | `/project.json` (Stops at root) |
