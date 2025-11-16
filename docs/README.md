> In the code snippets, JavaScript pseudocode is written. This is a TurboWarp extension, not a JS library. A JS library might be made for rxFS+.

# 📁 rxFS+ Extension Documentation

## 1. Overview

**rxFS+** is a Scratch extension that provides blocks for interacting with a virtual, **in-memory, Unix-like filesystem**. This allows you to create, read, write, and manage a complete file and directory structure entirely within your Scratch project.

-   **ID:** `lithsoft.rxfsplus`
    
-   **Author:** ohgodwhy2k
    
-   **License:** Creative Commons Zero v1.0
    

### 🧭 Key Concepts

Before you begin, you _must_ understand these core principles:

1.  **In-Memory Storage:** The filesystem is **not permanent**. It exists only in the project's memory. If you reload the page or close the project, **all files and directories will be lost**. To save your filesystem, you must use the `(export file system)` block and save the resulting string (e.g., in a list, cloud variable, or by downloading it). You can then use the `import file system from []` block to restore it later.
    
2.  **Unix-like Paths:** The filesystem uses a path structure similar to Linux or macOS.
    
    -   The root (the "base") of the filesystem is `/`.
        
    -   Paths are separated by a forward slash: `/path/to/file.txt`.
        
    -   The extension automatically normalizes paths: `//a/b/` will be treated as `/a/b`.
        
    -   All paths are **absolute** (they must start from the root `/`).
        
3.  **Error Handling:** This is the most important concept. Most blocks **will not stop your script** if they fail. Instead, they set an internal error message. You **must** check this message using the `(last error)` block immediately after running a command.
    
    -   A successful operation will set `(last error)` to an empty string (`""`).
        
    -   A failed operation (e.g., "File not found") will set `(last error)` to that message.
        

**Typical Error-Checking Pattern:**

Code snippet

```
write [Hello!] to file [/greeting.txt]
if <(last error) = []> then
  say [File written successfully!]
else
  say (join [Error: ] (last error))
end

```

----------

## 2. Block Reference

The blocks are grouped by their function.

### ⚠️ Error Handling

This is the most important block. Check it after every command.

#### `(last error)`

-   **Block:** `(last error)`
    
-   **Type:** Reporter
    
-   **Description:** Returns the error message from the last filesystem operation. If the operation was successful, this block returns an **empty string**.
    
-   **Returns:** `string` - The error message, or `""` if no error occurred.
    

----------

### 🗂️ File & Directory Creation

These blocks create new items in the filesystem.

#### `create file [STR]`

-   **Block:** `create file [/path/to/file.txt]`
    
-   **Type:** Command
    
-   **Description:** Creates a new, empty file at the specified path.
    
    -   If the file already exists, it **truncates** it (empties its content).
        
    -   If any parent directories (like `/path/to`) do not exist, they will be **automatically created**.
        
-   **Arguments:**
    
    -   `[STR]`: The full, absolute path for the file to create.
        
-   **Error States:**
    
    -   `"Invalid path"`: If the path is invalid (e.L., `""` or just `/`).
        
    -   `"Path is a directory"`: If an item at that path already exists and it is a directory.
        

#### `create directory [STR]`

-   **Block:** `create directory [/path/to/directory]`
    
-   **Type:** Command
    
-   **Description:** Creates a new, empty directory at the specified path.
    
    -   If the directory already exists, this block does nothing.
        
    -   If any parent directories (like `/path/to`) do not exist, they will be **automatically created**.
        
-   **Arguments:**
    
    -   `[STR]`: The full, absolute path for the directory to create.
        
-   **Error States:**
    
    -   `"Invalid path"`: If the path is invalid.
        
    -   `"Path is a file"`: If an item at that path already exists and it is a file.
        

#### `write [STR2] to file [STR]`

-   **Block:** `write [rxFS+ is good!] to file [/path/to/file.txt]`
    
-   **Type:** Command
    
-   **Description:** Writes content to a file.
    
    -   If the file **does not exist**, it will be **created**, along with any missing parent directories.
        
    -   If the file **does exist**, its content will be **completely overwritten**.
        
-   **Arguments:**
    
    -   `[STR2]`: The content to write into the file.
        
    -   `[STR]`: The full path of the file.
        
-   **Error States:**
    
    -   `"Invalid path"`: If the path is invalid.
        
    -   `"Path is a directory"`: If the path points to an existing directory.
        

#### `append [STR2] to file [STR]`

-   **Block:** `append [ more text] to file [/path/to/file.txt]`
    
-   **Type:** Command
    
-   **Description:** Adds text to the _end_ of an existing file.
    
    -   **Crucially:** This block **will not** create a new file or missing directories. The file must already exist.
        
-   **Arguments:**
    
    -   `[STR2]`: The content to append.
        
    -   `[STR]`: The full path of the existing file.
        
-   **Error States:**
    
    -   `"Path not found"`: If the path (or its parent directories) does not exist.
        
    -   `"File not found"`: If the path is valid but the file doesn't exist.
        
    -   `"Path is a directory"`: If the path points to a directory.
        

----------

### 📖 Reading Data

These blocks retrieve content.

#### `(read file [STR])`

-   **Block:** `(read file [/path/to/file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Reads and returns the full text content of a file.
    
-   **Arguments:**
    
    -   `[STR]`: The full path of the file to read.
        
-   **Returns:** `string` - The content of the file. Returns an empty string (`""`) if the file is empty or an error occurs.
    
-   **Error States:**
    
    -   `"File not found"`: If the file does not exist.
        
    -   `"Path is a directory"`: If the path points to a directory.
        

#### `(load [STR] from the web)`

-   **Block:** `(load [https://.../hello.txt] from the web)`
    
-   **Type:** Reporter (Asynchronous)
    
-   **Description:** Fetches the text content from a URL.
    
    -   **This block does NOT save the content to the filesystem.** It only returns the text. You must use `(write ...)` to save it.
        
    -   Because it's asynchronous, it will "wait" until the web request is complete.
        
-   **Arguments:**
    
    -   `[STR]`: The URL to fetch (e.g., a URL to a text file or API).
        
-   **Returns:** `string` - The text content from the URL.
    
-   **Error States:**
    
    -   `"Web request failed"`: If the fetch fails (e.g., URL not found, network error, CORS issue).
        

----------

### ♻️ Filesystem Operations

These blocks move, copy, and delete items.

#### `remove [STR]`

-   **Block:** `remove [/path/to/file.txt]`
    
-   **Type:** Command
    
-   **Description:** Deletes a file or directory. If a directory is specified, it deletes the directory **and everything inside it recursively**.
    
-   **Arguments:**
    
    -   `[STR]`: The path of the file or directory to delete.
        
-   **Error States:**
    
    -   `"Cannot remove root"`: You cannot delete the `/` directory.
        
    -   `"Path not found"`: The item to be removed does not exist.
        

#### `move [STR] to [STR2]`

-   **Block:** `move [/path/to/source] to [/path/to/destination]`
    
-   **Type:** Command
    
-   **Description:** Moves a file or directory from one location to another (a "rename").
    
    -   This block **will not overwrite**. The destination path must not already exist.
        
    -   Any missing parent directories for the destination (`/path/to`) will be created.
        
-   **Arguments:**
    
    -   `[STR]`: The source path of the item to move.
        
    -   `[STR2]`: The new destination path.
        
-   **Error States:**
    
    -   `"Cannot move root"`: You cannot move the `/` directory.
        
    -   `"Cannot move a directory into itself"`: e.g., moving `/data` to `/data/backup`.
        
    -   `"Source path not found"`: The item at `[STR]` doesn't exist.
        
    -   `"Invalid destination path"`: The `[STR2]` path is invalid.
        
    -   `"Destination path already exists"`: An item at `[STR2]` already exists.
        

#### `copy [STR] to [STR2]`

-   **Block:** `copy [/path/to/source] to [/path/to/destination]`
    
-   **Type:** Command
    
-   **Description:** Creates a deep copy of a file or directory at a new location.
    
    -   This block **will not overwrite**. The destination path must not already exist.
        
    -   Any missing parent directories for the destination (`/path/to`) will be created.
        
    -   If copying a directory, all its contents are copied recursively.
        
-   **Arguments:**
    
    -   `[STR]`: The source path of the item to copy.
        
    -   `[STR2]`: The new destination path for the copy.
        
-   **Error States:**
    
    -   `"Cannot copy root"`: You cannot copy the `/` directory.
        
    -   `"Cannot copy a directory into itself"`: e.g., copying `/data` to `/data/backup`.
        
    -   `"Source path not found"`: The item at `[STR]` doesn't exist.
        
    -   `"Invalid destination path"`: The `[STR2]` path is invalid.
        
    -   `"Destination path already exists"`: An item at `[STR2]` already exists.
        

#### `rename [STR] to [STR2] (overwrite [OVER])`

-   **Block:** `rename [/path/to/source] to [/path/to/destination] (overwrite [false v])`
    
-   **Type:** Command
    
-   **Description:** Moves/renames a file or directory, with an option to overwrite the destination. This is similar to `move` but more powerful.
    
-   **Arguments:**
    
    -   `[STR]`: The source path of the item to move.
        
    -   `[STR2]`: The new destination path.
        
    -   `[OVER]`: A dropdown menu.
        
        -   `not recursively` (value: "false"): Will **fail** if the destination already exists.
            
        -   `recursively` (value: "true"): Will **delete** the destination if it exists before renaming. (Note: The menu text is non-intuitive, but "true" means overwrite).
            
-   **Error States:**
    
    -   `"Cannot rename root"`, `"Cannot rename a directory into itself"`, `"Source path not found"`, `"Invalid destination path"`.
        
    -   `"Destination path already exists"`: (Only if `OVER` is "false" and `[STR2]` exists).
        

----------

### 🔍 Filesystem Inspection

These blocks get information _about_ files and directories.

#### `(list [TYPE] in [STR])`

-   **Block:** `(list [both v] in [/])`
    
-   **Type:** Reporter
    
-   **Description:** Returns a JSON-formatted list of items inside a directory.
    
-   **Arguments:**
    
    -   `[TYPE]`: A dropdown menu:
        
        -   `files`: List only files.
            
        -   `directories`: List only directories.
            
        -   `both`: List files and directories.
            
    -   `[STR]`: The full path of the directory to list.
        
-   **Returns:** `string` - A JSON string array of full paths.
    
    -   Example: `["/data/file1.txt", "/data/subdir"]`
        
    -   If the directory is empty or an error occurs, it returns `"[]"`.
        
-   **Error States:**
    
    -   `"Path not found"`: The directory at `[STR]` does not exist.
        
    -   `"Path is a file"`: The path points to a file, not a directory.
        

#### `<path [STR] exists?>`

-   **Block:** `<path [/path/to/file.txt] exists?>`
    
-   **Type:** Boolean
    
-   **Description:** Checks if a file or directory exists at the given path.
    
-   **Arguments:**
    
    -   `[STR]`: The path to check.
        
-   **Returns:** `true` if the path exists, `false` otherwise.
    

#### `(get type of path [STR])`

-   **Block:** `(get type of path [/path/to/file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Returns the type of the item at the specified path.
    
-   **Arguments:**
    
    -   `[STR]`: The path to check.
        
-   **Returns:** `string` - One of three values:
    
    -   `"file"`
        
    -   `"directory"`
        
    -   `"none"` (if the path does not exist)
        

#### `touch [STR]`

-   **Block:** `touch [/path/to/file.txt]`
    
-   **Type:** Command
    
-   **Description:** Updates the "modification time" of a file or directory to the current time.
    
    -   If the file **does not exist**, this block will **create it** as an empty file (just like `create file`).
        
-   **Arguments:**
    
    -   `[STR]`: The path to "touch".
        

#### `(get size of [STR])`

-   **Block:** `(get size of [/path/to/file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Gets the "size" of an item. The meaning of "size" depends on the type:
    
    -   **File:** Returns the size of the content in **bytes** (e.g., "hello" is 5).
        
    -   **Directory:** Returns the number of **immediate children** in the directory (it is _not_ a recursive size).
        
-   **Arguments:**
    
    -   `[STR]`: The path to the item.
        
-   **Returns:** `number` - The size. Returns `0` if the path is not found.
    
-   **Error States:**
    
    -   `"Path not found"`: The item does not exist.
        

#### `(get creation time of [STR])`

-   **Block:** `(get creation time of [/path/to/file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Returns the timestamp (in milliseconds) of when the file or directory was first created.
    
-   **Arguments:**
    
    -   `[STR]`: The path to the item.
        
-   **Returns:** `number` - The creation timestamp. Returns `0` on error.
    
-   **Error States:**
    
    -   `"Path not found"`
        

#### `(get modification time of [STR])`

-   **Block:** `(get modification time of [/path/to/file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Returns the timestamp (in milliseconds) of when the file or directory was last modified (e.g., by `write`, `append`, `touch`, or `rename`).
    
-   **Arguments:**
    
    -   `[STR]`: The path to the item.
        
-   **Returns:** `number` - The modification timestamp. Returns `0` on error.
    
-   **Error States:**
    
    -   `"Path not found"`
        

#### `set permissions of [STR] to [MODE] (octal) depth [DEPTH]`

-   **Block:** `set permissions of [/path/to/file.txt] to [755] (octal) depth [-1]`
    
-   **Type:** Command
    
-   **Description:** Sets the (simulated) permissions for a file or directory.
    
    > **Note:** These permissions are just metadata. They are **not enforced**. A file with "000" (no permissions) can still be read and written to.
    
-   **Arguments:**
    
    -   `[STR]`: The path to the item.
        
    -   `[MODE]`: An octal permission string (e.g., `755`, `644`).
        
    -   `[DEPTH]`: How deep to apply the change (for directories):
        
        -   `0`: Apply to this item only.
            
        -   `1`, `2`,...: Apply to this item and children _n_ levels deep.
            
        -   `-1` (or blank): Apply recursively to this item and **all** children.
            
-   **Error States:**
    
    -   `"Path not found"`
        
    -   `"Invalid permission mode"`
        
    -   `"Invalid depth"`
        

----------

### 🔧 Path Utilities

These are helper blocks for working with path strings. They do not interact with the filesystem.

#### `(join path [STR] with [STR2])`

-   **Block:** `(join path [/path/to] with [file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Safely joins two path components into one.
    
-   **Example:** `(join path [/path/to/] with [/file.txt])` returns `/path/to/file.txt`.
    
-   **Returns:** `string` - The combined path.
    

#### `(get basename of [STR])`

-   **Block:** `(get basename of [/path/to/file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Returns the last part of a path (the filename or directory name).
    
-   **Example:** `(get basename of [/path/to/file.txt])` returns `file.txt`.
    
-   **Returns:** `string` - The basename.
    

#### `(get dirname of [STR])`

-   **Block:** `(get dirname of [/path/to/file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Returns the parent directory portion of a path.
    
-   **Example:** `(get dirname of [/path/to/file.txt])` returns `/path/to`.
    
-   **Returns:** `string` - The directory name.
    

#### `(get extension of [STR])`

-   **Block:** `(get extension of [/path/to/file.txt])`
    
-   **Type:** Reporter
    
-   **Description:** Returns the file extension, including the dot.
    
-   **Example 1:** `(get extension of [file.txt])` returns `.txt`.
    
-   **Example 2:** `(get extension of [archive.tar.gz])` returns `.gz`.
    
-   **Example 3:** `(get extension of [.config])` returns `""` (Unix-style "dotfiles" have no extension).
    
-   **Returns:** `string` - The extension.
    

----------

### 💾 Filesystem Management

These blocks are for saving and loading your entire filesystem.

#### `clear the file system`

-   **Block:** `clear the file system`
    
-   **Type:** Command
    
-   **Description:** **Deletes everything.** Wipes the entire filesystem and resets it to a single empty root (`/`) directory.
    

#### `import file system from [STR]`

-   **Block:** `import file system from [N4Igzg9grgTgxgUwCoE8AOD... ]`
    
-   **Type:** Command
    
-   **Description:** **Completely replaces** the current filesystem with the one from the provided string. This string should come from the `(export file system)` block.
    
-   **Arguments:**
    
    -   `[STR]`: The compressed, Base64-encoded filesystem string.
        
-   **Error States:**
    
    -   `"Decompression failed (null)"`
        
    -   `"Failed to parse FS JSON"`
        
    -   `"Invalid FS data structure"`
        

#### `(export file system)`

-   **Block:** `(export file system)`
    
-   **Type:** Reporter
    
-   **Description:** This is the **SAVE** block. It takes the entire current filesystem, compresses it (using LZString), and encodes it into a Base64 string. You must save this string to make your filesystem permanent.
    
-   **Returns:** `string` - A very long string representing your entire filesystem.
    
-   **Error States:**
    
    -   `"Failed to stringify or compress FS"`
        

----------

## 3. Common Workflows & Examples

### Workflow: Saving and Loading

This is the most critical workflow.

**To Save Your Work:**

1.  Do all your file operations (`write`, `create directory`, etc.).
    
2.  When ready to save (e.g., user clicks a "Save" button), run `(export file system)`.
    
3.  Store the resulting string. You can:
    
    -   Add it to a list (if it fits).
        
    -   Store it in a cloud variable (if it's under the 256-char limit, which is unlikely for a complex FS).
        
    -   Have the user download it (using other extensions) or copy-paste it.
        

Code snippet

```
when [save v] key pressed
set [saved_fs v] to (export file system)
say [Filesystem saved!]

```

**To Load Your Work:**

1.  When the project starts (or the user clicks "Load"), get the saved string.
    
2.  Use the `import file system from []` block to restore it.
    

Code snippet

```
when green flag clicked
import file system from (saved_fs)
if <(last error) = []> then
  say [Filesystem loaded!]
else
  say [Failed to load filesystem!]
end

```

### Example: Creating a User Profile

This example shows how to create a file, write to it, read from it, and check for errors.

Code snippet

```
define setup_user (username, real_name)
  set [path v] to (join path [/users] with (username))
  create directory (path)
  
  set [profile_path v] to (join path (path) with [profile.txt])
  write (real_name) to file (profile_path)
  
  if <(last error) = []> then
    say (join [Created profile for ] (real_name))
  else
    say (join [Error setting up user: ] (last error))
  end

define read_user (username)
  set [path v] to (join path [/users] with (username))
  set [profile_path v] to (join path (path) with [profile.txt])
  
  set [real_name v] to (read file (profile_path))
  
  if <(last error) = []> then
    say (join [Username: ] (username))
    say (join [Real Name: ] (real_name))
  else
    say (join [Error reading user: ] (last error))
  end
  
when green flag clicked
  clear the file system
  setup_user [griffpatch] [Griffpatch]
  read_user [griffpatch]

```
