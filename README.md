# 📁 rxFS+

**Blocks for interacting with a Unix-like, in-memory filesystem directly within your Scratch project.**

| 🏷️ Metadata | Value |
| :--- | :--- |
| **ID** | `lithsoft.rxfsplus` |
| **Author** | ohgodwhy2k |
| **License** | Creative Commons Zero v1.0 |

-----

## 🚀 Overview

**rxFS+** is an advanced Scratch extension that provides a full virtual filesystem structure (directories, files, paths) for your projects. It allows you to build complex applications that require file management, configuration storage, game saves, and more, all without leaving the Scratch environment.

### Key Features

  * **Unix-like Paths:** Use familiar paths like `/data/config.json`.
  * **In-Memory Storage:** Fast, virtual, and isolated to the running project.
  * **Full Command Set:** Includes `create`, `read`, `write`, `append`, `move`, `copy`, `remove`, and `list`.
  * **Save/Load:** Easily export and import the entire filesystem as a single, compressed, Base64 string for saving and loading (e.g., using Lists or Cloud Variables).
  * **Detailed Metadata:** Access creation time, modification time, size, and type for any path.
  * **Built-in Error Handling:** Robust error reporting via the `(last error)` block.

-----

## ⚠️ The Most Important Rule: Error Checking

**All filesystem operations must be followed by a check of the `(last error)` reporter.**

If a block fails (e.g., trying to read a file that doesn't exist), it will set an error message but **will not stop your script**. If `(last error)` is empty (`""`), the operation succeeded.

```scratch
create directory [/my_data]
if <(last error) = []> then
  write [Hello!] to file [/my_data/log.txt]
  if <(last error) = []> then
    say [File written successfully]
  else
    say (join [Write Error: ] (last error))
  end
else
  say (join [Directory Error: ] (last error))
end
```

-----

## 💾 Saving and Loading the Filesystem

The filesystem is **in-memory** and is **lost** when the project closes or reloads. To persist your data, you must use the `export` and `import` blocks.

### Exporting (Saving)

Use the `(export file system)` block to compress and encode the entire filesystem into a single string. Store this string in a **List** or a Cloud Variable (if small enough).

```scratch
when [save v] key pressed
set [saved_data v] to (export file system)
// The saved_data variable now holds the save string.
```

### Importing (Loading)

Use the `import file system from []` block to completely replace the current filesystem with a previously saved one.

```scratch
when green flag clicked
import file system from (saved_data)
if <(last error) = []> then
  say [Filesystem restored.]
else
  say [Load Error: FS data corrupted or missing.]
end
```

-----

## Block Highlights

| Category | Block | Description |
| :--- | :--- | :--- |
| **Error** | `(last error)` | Returns the error message from the previous operation, or `""` if successful. |
| **Creation** | `write [content] to file [/path]` | Creates the file (and missing parent directories) or overwrites existing content. |
| **Reading** | `(read file [/path])` | Returns the entire text content of the file. |
| **Structure** | `create directory [/path]` | Creates a new directory, including any missing parent directories. |
| **Management** | `remove [/path]` | Deletes a file or recursively deletes a directory and its contents. |
| **Inspection** | `(list [files v] in [/path])` | Returns a JSON string array of the directory contents. |
| **Inspection** | `<path [/path] exists?>` | Returns `true` if the path points to a file or directory. |
| **Save/Load** | `(export file system)` | Compresses the entire FS into a string for saving. |
| **Save/Load** | `import file system from [string]` | Restores the entire FS from a saved string. |
| **Utility** | `(join path [A] with [B])` | Safely combines two path components (e.g., `/folder` and `file.txt` becomes `/folder/file.txt`). |
