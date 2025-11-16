// Name: rxFS+
// ID: rxFSplus
// Description: Blocks for interacting with a Unix-like integrated filesystem in-memory. Like rxFS, but better.
// By: ohgodwhy2k
// License: Creative Commons Zero v1.0

(function (Scratch) {
  "use strict";

  var LZString = (function () {
    var f = String.fromCharCode;
    var keyStrBase64 =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var baseReverseDic = {};
    function getBaseValue(alphabet, character) {
      if (!baseReverseDic[alphabet]) {
        baseReverseDic[alphabet] = {};
        for (var i = 0; i < alphabet.length; i++) {
          baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
      }
      return baseReverseDic[alphabet][character];
    }
    var LZString = {
      compressToBase64: function (input) {
        if (input == null) return "";
        var res = LZString._compress(input, 6, function (a) {
          return keyStrBase64.charAt(a);
        });
        switch (res.length % 4) {
          default:
          case 0:
            return res;
          case 1:
            return res + "===";
          case 2:
            return res + "==";
          case 3:
            return res + "=";
        }
      },
      decompressFromBase64: function (input) {
        if (input == null) return "";
        if (input == "") return null;
        return LZString._decompress(input.length, 32, function (index) {
          return getBaseValue(keyStrBase64, input.charAt(index));
        });
      },
      _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
        if (uncompressed == null) return "";
        var i,
          value,
          context_dictionary = {},
          context_dictionaryToCreate = {},
          context_c = "",
          context_wc = "",
          context_w = "",
          context_enlargeIn = 2,
          context_dictSize = 3,
          context_numBits = 2,
          context_data = [],
          context_data_val = 0,
          context_data_position = 0,
          ii;
        for (ii = 0; ii < uncompressed.length; ii += 1) {
          context_c = uncompressed.charAt(ii);
          if (
            !Object.prototype.hasOwnProperty.call(context_dictionary, context_c)
          ) {
            context_dictionary[context_c] = context_dictSize++;
            context_dictionaryToCreate[context_c] = true;
          }
          context_wc = context_w + context_c;
          if (
            Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)
          ) {
            context_w = context_wc;
          } else {
            if (
              Object.prototype.hasOwnProperty.call(
                context_dictionaryToCreate,
                context_w
              )
            ) {
              if (context_w.charCodeAt(0) < 256) {
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 8; i++) {
                  context_data_val = (context_data_val << 1) | (value & 1);
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              } else {
                value = 1;
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = (context_data_val << 1) | value;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = 0;
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 16; i++) {
                  context_data_val = (context_data_val << 1) | (value & 1);
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
            } else {
              value = context_dictionary[context_w];
              for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            context_dictionary[context_wc] = context_dictSize++;
            context_w = String(context_c);
          }
        }
        if (context_w !== "") {
          if (
            Object.prototype.hasOwnProperty.call(
              context_dictionaryToCreate,
              context_w
            )
          ) {
            if (context_w.charCodeAt(0) < 256) {
              for (i = 0; i < context_numBits; i++) {
                context_data_val = context_data_val << 1;
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 8; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            } else {
              value = 1;
              for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | value;
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 16; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
        }
        value = 2;
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
        while (true) {
          context_data_val = context_data_val << 1;
          if (context_data_position == bitsPerChar - 1) {
            context_data.push(getCharFromInt(context_data_val));
            break;
          } else context_data_position++;
        }
        return context_data.join("");
      },
      _decompress: function (length, resetValue, getNextValue) {
        var dictionary = [],
          next,
          enlargeIn = 4,
          dictSize = 4,
          numBits = 3,
          entry = "",
          result = [],
          i,
          w,
          bits,
          resb,
          maxpower,
          power,
          c,
          data = {
            val: getNextValue(0),
            position: resetValue,
            index: 1,
          };
        for (i = 0; i < 3; i += 1) {
          dictionary[i] = i;
        }
        bits = 0;
        maxpower = Math.pow(2, 2);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        switch ((next = bits)) {
          case 0:
            bits = 0;
            maxpower = Math.pow(2, 8);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            c = f(bits);
            break;
          case 1:
            bits = 0;
            maxpower = Math.pow(2, 16);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            c = f(bits);
            break;
          case 2:
            return "";
        }
        dictionary[3] = c;
        w = c;
        result.push(c);
        while (true) {
          if (data.index > length) {
            return "";
          }
          bits = 0;
          maxpower = Math.pow(2, numBits);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          switch ((c = bits)) {
            case 0:
              bits = 0;
              maxpower = Math.pow(2, 8);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              dictionary[dictSize++] = f(bits);
              c = dictSize - 1;
              enlargeIn--;
              break;
            case 1:
              bits = 0;
              maxpower = Math.pow(2, 16);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              dictionary[dictSize++] = f(bits);
              c = dictSize - 1;
              enlargeIn--;
              break;
            case 2:
              return result.join("");
          }
          if (enlargeIn == 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }
          if (dictionary[c]) {
            entry = dictionary[c];
          } else {
            if (c === dictSize) {
              entry = w + w.charAt(0);
            } else {
              return null;
            }
          }
          result.push(entry);
          dictionary[dictSize++] = w + entry.charAt(0);
          enlargeIn--;
          w = entry;
          if (enlargeIn == 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }
        }
      },
    };
    return LZString;
  })();

  Scratch.translate.setup({
    de: {
      clean: "Dateisystem leeren",
      del: "Lösche [STR]",
      folder: "Setze [STR] auf [STR2]",
      folder_default: "rxFS ist gut!",
      in: "Dateisystem von [STR] importieren",
      list: "Alle Dateien unter [STR] auflisten",
      open: "Öffne [STR]",
      out: "Dateisystem exportieren",
      search: "Suche [STR]",
      start: "Erschaffe [STR]",
      sync: "Ändere die Position von [STR] zu [STR2]",
      webin: "Lade [STR] vom Web",
    },
    es: { folder_default: "¡rxFS es bueno!" },
    fi: {
      clean: "tyhjennä tiedostojärjestelmä",
      del: "poista [STR]",
      folder: "aseta [STR] arvoon [STR2]",
      folder_default: "rxFS on hieno!",
      in: "tuo tiedostojärjestelmä kohteesta [STR]",
      list: "luettelo kaikista kohteessa [STR] sijaitsevista tiedostoista",
      open: "avaa [STR]",
      out: "vie tiedostojärjestelmä",
      search: "etsi [STR]",
      start: "luo [STR]",
      sync: "muuta kohteen [STR] sijainniksi [STR2]",
      webin: "lataa [STR] verkosta",
    },
    fr: {
      clean: "effacer le système de fichiers",
      del: "supprimer [STR]",
      folder: "mettre [STR] à [STR2]",
      folder_default: "rxFS est bon !",
      in: "importer le système de fichier depuis [STR]",
      list: "lister tous les fichiers sous [STR]",
      open: "ouvrir [STR]",
      out: "exporter le système de fichiers",
      search: "chercher [STR]",
      start: "créer [STR]",
      sync: "modifier l'emplacement de [STR] à [STR2]",
      webin: "charger [STR] depuis le web",
    },
    it: {
      clean: "svuota file system",
      del: "cancella [STR]",
      folder: "imposta [STR] a [STR2]",
      folder_default: "rxFS funziona!",
      in: "importa file system da [STR]",
      list: "elenca tutti i file in [STR]",
      open: "apri [STR]",
      out: "esporta file system",
      search: "cerca [STR]",
      start: "crea [STR]",
      sync: "cambia posizione di [STR] a [STR2]",
      webin: "carica [STR] dal web",
    },
    ja: {
      clean: "ファイルシステムを削除する",
      del: "[STR]を削除",
      folder: "[STR]を[STR2]にセットする",
      folder_default: "rxFSは良い!",
      in: "[STR]からファイルシステムをインポートする",
      list: "[STR]直下のファイルをリスト化する",
      open: "[STR]を開く",
      out: "ファイルシステムをエクスポートする",
      search: "[STR]を検索",
      start: "[STR]を作成",
      sync: "[STR]のロケーションを[STR2]に変更する",
      webin: "[STR]をウェブから読み込む",
    },
    ko: {
      clean: "파일 시스템 초기화하기",
      del: "[STR] 삭제하기",
      folder: "[STR]을(를) [STR2](으)로 정하기",
      folder_default: "rxFS 최고!",
      in: "[STR]에서 파일 시스템 불러오기",
      list: "[STR] 안의 파일 목록",
      open: "[STR] 열기",
      out: "파일 시스템 내보내기",
      search: "[STR] 검색하기",
      start: "[STR] 생성하기",
      sync: "[STR]의 경로를 [STR2](으)로 바꾸기",
      webin: "웹에서 불러오기 [STR]",
    },
    nb: { folder_default: "rxFS er bra!" },
    nl: {
      clean: "wis het bestandssysteem",
      del: "verwijder [STR]",
      folder: "maak [STR] [STR2]",
      folder_default: "rxFS is geweldig!",
      in: "importeer bestandssysteem van [STR]",
      list: "alle bestanden onder [STR]",
      out: "exporteer bestandssysteem",
      search: "zoek [STR]",
      start: "creëer [STR]",
      sync: "laad [STR] van het web",
    },
    pl: { del: "usuń [STR]", folder: "ustaw [STR] na [STR2]", open: "otwórz [STR]", search: "szukaj [STR]" },
    ru: {
      clean: "очистить файловую систему",
      del: "удалить [STR]",
      folder: "задать [STR] значение [STR2]",
      folder_default: "rxFS это хорошо!",
      in: "импортировать файловую систему из [STR]",
      list: "перечислить все файлы под [STR]",
      open: "открыть [STR]",
      out: "экспортировать файловую систему",
      search: "поиск [STR]",
      start: "создать [STR]",
      sync: "изменить расположение [STR] на [STR2]",
      webin: "загрузить [STR] из сети",
    },
    "zh-cn": {
      clean: "清空文件系统",
      del: "删除 [STR]",
      folder: "将[STR]设为[STR2]",
      folder_default: "rxFS 好用！",
      in: "从 [STR] 导入文件系统",
      list: "列出 [STR] 下的所有文件",
      open: "打开 [STR]",
      out: "导出文件系统",
      search: "搜索 [STR]",
      start: "新建 [STR]",
      sync: "将 [STR] 的位置改为 [STR2]",
      webin: "从网络加载 [STR]",
    },
  });

  const newFsRoot = () => ({
    type: "directory",
    children: {},
    permissions: 0o755,
    ctime: Date.now(),
    mtime: Date.now(),
  });

  let fsRoot = newFsRoot();

  const folder =
    "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIyOC40NjI1IiBoZWlnaHQ9IjI3LjciIHZpZXdCb3g9IjAsMCwyOC40NjI1LDI3LjciPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMjYuMDE5NTMsLTE2NC4xMTg3NSkiPjxnIGRhdGEtcGFwZXItZGF0YT0ieyZxdW90O2lzUGFpbnRpbmdMYXllciZxdW90Ozp0cnVlfSIgZmlsbD0iIzk5NjZmZiIgZmlsbC1ydWxlPSJub256ZXJvIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLWRhc2hhcnJheT0iIiBzdHJva2UtZGFzaG9mZnNldD0iMCIgZm9udC1mYW1pbHk9IlNhbnMgU2VyaWYiIGZvbnQtd2VpZ2h0PSJub3JtYWwiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJzdGFydCIgc3R5bGU9Im1peC1ibGVuZC1tb2RlOiBub3JtYWwiPjx0ZXh0IHRyYW5zZm9ybT0idHJhbnNsYXRlKDIyNi4yNjk1MywxODUuNzY4NzUpIHNjYWxlKDAuNSwwLjUpIiBmb250LXNpemU9IjQwIiB4bWw6c3BhY2U9InByZXNlcnZlIiBmaWxsPSIjOTk2NmZmIiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0iYnV0dCIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2UtZGFzaGFycmF5PSIiIHN0cm9rZS1kYXNob2Zmc2V0PSIwIiBmb250LWZhbWlseT0iU2FucyBTZXJpZiIgZm9udC13ZWlnaHQ9Im5vcm1hbCIgdGV4dC1hbmNob3I9InN0YXJ0IiBzdHlsZT0ibWl4LWJsZW5kLW1vZGU6IG5vcm1hbCI+PHRzcGFuIHg9IjAiIGR5PSIwIj7wn5OBPC90c3Bhbj48L3RleHQ+PC9nPjwvZz48L3N2Zz48IS0tcm90YXRpb25DZW50ZXI6MTMuOTgwNDY4NzU6MTUuODgxMjQ5MjM3MDYwNTMtLT4=";
  const file =
    "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIyOC40NjI1IiBoZWlnaHQ9IjI3LjciIHZpZXdCb3g9IjAsMCwyOC40NjI1LDI3LjciPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMjYuMDE5NTMsLTE2NC4xMTg3NSkiPjxnIGRhdGEtcGFwZXItZGF0YT0ieyZxdW90O2lzUGFpbnRpbmdMYXllciZxdW90Ozp0cnVlfSIgZmlsbD0iIzk5NjZmZiIgZmlsbC1ydWxlPSJub256ZXJvIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLWRhc2hhcnJheT0iIiBzdHJva2UtZGFzaG9mZnNldD0iMCIgZm9udC1mYW1pbHk9IlNhbnMgU2VyaWYiIGZvbnQtd2VpZ2h0PSJub3JtYWwiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJzdGFydCIgc3R5bGU9Im1peC1ibGVuZC1tb2RlOiBub3JtYWwiPjx0ZXh0IHRyYW5zZm9ybT0idHJhbnNsYXRlKDIyNi4yNjk1MywxODUuNzY4NzUpIHNjYWxlKDAuNSwwLjUpIiBmb250LXNpemU9IjQwIiB4bWw6c3BhY2U9InByZXNlcnZlIiBmaWxsPSIjOTk2NmZmIiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0iYnV0dCIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2UtZGFzaGFycmF5PSIiIHN0cm9rZS1kYXNob2Zmc2V0PSIwIiBmb250LWZhbWlseT0iU2FucyBTZXJpZiIgZm9udC13ZWlnaHQ9Im5vcm1hbCIgdGV4dC1hbmNob3I9InN0YXJ0IiBzdHlsZT0ibWl4LWJsZW5kLW1vZGU6IG5vcm1hbCI+PHRzcGFuIHg9IjAiIGR5PSIwIj7wn5ODPC90c3Bhbj48L3RleHQ+PC9nPjwvZz48L3N2Zz48IS0tcm90YXRpb25DZW50ZXI6MTMuOTgwNDY4NzU6MTUuODgxMjQ5NjE4NTMwMjYyLS0+";

  class rxFSPlus {
    constructor() {
      this.lastError = "";

      this._normalizePath = (path) => {
        let newPath = String(path || "")
          .replace(/\/+/g, "/")
          .trim();
        if (newPath.length > 1 && newPath.endsWith("/")) {
          newPath = newPath.substring(0, newPath.length - 1);
        }
        if (!newPath.startsWith("/")) {
          newPath = "/" + newPath;
        }
        return newPath;
      };

      this._getNode = (path) => {
        const normPath = this._normalizePath(path);
        if (normPath === "/") return fsRoot;
        const parts = normPath.split("/").filter((p) => p.length > 0);
        let currentNode = fsRoot;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (
            currentNode.type !== "directory" ||
            !Object.prototype.hasOwnProperty.call(currentNode.children, part)
          ) {
            return null;
          }
          currentNode = currentNode.children[part];
        }
        return currentNode;
      };

      this._getParentAndKey = (path, createDirs = false) => {
        const normPath = this._normalizePath(path);
        if (normPath === "/") return { parent: null, key: null };
        const parts = normPath.split("/").filter((p) => p.length > 0);
        const key = parts[parts.length - 1];
        let currentDir = fsRoot;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          let child = currentDir.children[part];
          if (!child) {
            if (createDirs) {
              const now = Date.now();
              child = {
                type: "directory",
                children: {},
                permissions: 0o755,
                ctime: now,
                mtime: now,
              };
              currentDir.children[part] = child;
              currentDir.mtime = now;
            } else {
              return { parent: null, key: null };
            }
          }
          if (child.type !== "directory") {
            return { parent: null, key: null };
          }
          currentDir = child;
        }
        return { parent: currentDir, key: key };
      };

      this._deepCopyNode = (node) => {
        const now = Date.now();

        const newNode =
          typeof structuredClone === "function"
            ? structuredClone(node)
            : JSON.parse(JSON.stringify(node));

        function resetTimestamps(n) {
          n.ctime = now;
          n.mtime = now;
          if (n.type === "directory") {
            for (const key in n.children) {
              if (Object.prototype.hasOwnProperty.call(n.children, key)) {
                resetTimestamps(n.children[key]);
              }
            }
          }
        }

        resetTimestamps(newNode);
        return newNode;
      };

      this._recursiveChmod = (node, perms, depth) => {
        const now = Date.now();
        node.permissions = perms;
        node.mtime = now;
        if (node.type === "directory" && depth !== 0) {
          const nextDepth = depth === undefined || depth === -1 ? -1 : depth - 1;
          for (const key in node.children) {
            if (Object.prototype.hasOwnProperty.call(node.children, key)) {
              this._recursiveChmod(node.children[key], perms, nextDepth);
            }
          }
        }
      };
    }

    getInfo() {
      return {
        id: "rxFSplus",
        name: "rxFS+",
        color1: "#192d50",
        color2: "#192d50",
        color3: "#192d50",

        menus: {
          listType: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("files"),
                value: "files",
              },
              {
                text: Scratch.translate("directories"),
                value: "directories",
              },
              {
                text: Scratch.translate("both"),
                value: "both",
              },
            ],
          },
          pathType: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("file"),
                value: "file",
              },
              {
                text: Scratch.translate("directory"),
                value: "directory",
              },
              {
                text: Scratch.translate("none"),
                value: "none",
              },
            ],
          },
          recursive: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("recursively"),
                value: "true",
              },
              {
                text: Scratch.translate("not recursively"),
                value: "false",
              },
            ],
          },
        },

        blocks: [
          {
            opcode: "getLastError",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "getLastError",
              default: "last error",
            }),
            disableMonitor: true,
          },
          "---",
          {
            blockIconURI: file,
            opcode: "createFile",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "createFile",
              default: "create file [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "createDirectory",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "createDirectory",
              default: "create directory [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/directory",
              },
            },
          },
          {
            blockIconURI: file,
            opcode: "writeFile",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "writeFile",
              default: "write [STR2] to file [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
              STR2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "rxFS+ is good!",
              },
            },
          },
          {
            blockIconURI: file,
            opcode: "appendFile",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "appendFile",
              default: "append [STR2] to file [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
              STR2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: " more text",
              },
            },
          },
          "---",
          {
            blockIconURI: file,
            opcode: "readFile",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "readFile",
              default: "read file [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: file,
            opcode: "webin",
            blockType: Scratch.BlockType.REPORTER,

            isAsync: true,
            text: Scratch.translate({
              id: "webin",
              default: "load [STR] from the web",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://0832k12.github.io/rxFS/hello.txt",
              },
            },
          },
          "---",
          {
            blockIconURI: folder,
            opcode: "remove",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "remove",
              default: "remove [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "move",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "move",
              default: "move [STR] to [STR2]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/source",
              },
              STR2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/destination",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "copy",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({ id: "copy", default: "copy [STR] to [STR2]" }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/source",
              },
              STR2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/destination",
              },
            },
          },

          {
            blockIconURI: folder,
            opcode: "rename",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "rename",
              default: "rename [STR] to [STR2] (overwrite [OVER])",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/source",
              },
              STR2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/destination",
              },
              OVER: {
                type: Scratch.ArgumentType.STRING,
                menu: "recursive",
                defaultValue: "false",
              },
            },
          },
          "---",
          {
            blockIconURI: folder,
            opcode: "list",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "list_new",
              default: "list [TYPE] in [STR]",
            }),
            arguments: {
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "listType",
                defaultValue: "both",
              },
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "pathExists",
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate({
              id: "pathExists",
              default: "path [STR] exists?",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "getPathType",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "getPathType",
              default: "get type of path [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: file,
            opcode: "touch",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({ id: "touch", default: "touch [STR]" }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "getSize",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({ id: "getSize", default: "get size of [STR]" }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "getCTime",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "getCTime",
              default: "get creation time of [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "getMTime",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "getMTime",
              default: "get modification time of [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "chmod",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "chmod",
              default: "set permissions of [STR] to [MODE] (octal) depth [DEPTH]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
              MODE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "755",
              },
              DEPTH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "-1", 
              },
            },
          },
          "---",
          {
            opcode: "joinPath",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "joinPath",
              default: "join path [STR] with [STR2]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to",
              },
              STR2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "file.txt",
              },
            },
          },
          {
            opcode: "getBasename",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "getBasename",
              default: "get basename of [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            opcode: "getDirname",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "getDirname",
              default: "get dirname of [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          {
            opcode: "getExtension",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "getExtension",
              default: "get extension of [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "/path/to/file.txt",
              },
            },
          },
          "---",
          {
            blockIconURI: folder,
            opcode: "clean",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "clean",
              default: "clear the file system",
            }),
            arguments: {},
          },
          {
            blockIconURI: folder,
            opcode: "in",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "in",
              default: "import file system from [STR]",
            }),
            arguments: {
              STR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "N4Igzg9grgTgxgUwCoE8AOD0GECGAXAlAQQDkBDCALgQYCiAdCALrJGBWAAgA4BOAegEEANgC4AKnFwBbZlAAKASgCiAGgQUoAYwimANnDQA3KGU4BfEaTKIAbgAkAkgBKAeQCiAGYANCE8rABKYqJ+QSAARmBMAJ7SImISkgoA6gCiAEZgACIMzADmIAAWYBAi8pLSAcQA1tCSrGAAthSgALbUABJqAMx1fACqAEJgYdJkAGYwAcTqAOIAggByADIMAIJMgXJg+iYmZZXVNbV1iEGVYABMoEHWAcQBhAGkAWQB5AGUAeQAUAEEABkAAgArg5HO4XF4kghklEYllWjUVmsNjkdkA",
              },
            },
          },
          {
            blockIconURI: folder,
            opcode: "out",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "out",
              default: "export file system",
            }),
            arguments: {},
          },
        ],
      };
    }

    clean() {
      fsRoot = newFsRoot();
      this.lastError = "";
    }

    createFile({ STR }) {
      this.lastError = "";
      const { parent, key } = this._getParentAndKey(STR, true);
      if (!parent || !key) {
        this.lastError = "Invalid path";
        return;
      }

      const now = Date.now();
      if (Object.prototype.hasOwnProperty.call(parent.children, key)) {
        const node = parent.children[key];
        if (node.type === "file") {
          node.content = "";
          node.mtime = now;
          parent.mtime = now;
        } else {
          this.lastError = "Path is a directory";
        }
        return;
      }

      parent.children[key] = {
        type: "file",
        content: "",
        permissions: 0o644,
        ctime: now,
        mtime: now,
      };
      parent.mtime = now;
    }

    createDirectory({ STR }) {
      this.lastError = "";
      const { parent, key } = this._getParentAndKey(STR, true);
      if (!parent || !key) {
        this.lastError = "Invalid path";
        return;
      }

      if (Object.prototype.hasOwnProperty.call(parent.children, key)) {
        if (parent.children[key].type === "directory") {
          return;
        }
        this.lastError = "Path is a file";
        return;
      }

      const now = Date.now();
      parent.children[key] = {
        type: "directory",
        children: {},
        permissions: 0o755,
        ctime: now,
        mtime: now,
      };
      parent.mtime = now;
    }

    writeFile({ STR, STR2 }) {
      this.lastError = "";
      const { parent, key } = this._getParentAndKey(STR, true);
      if (!parent || !key) {
        this.lastError = "Invalid path";
        return;
      }

      const now = Date.now();
      let node = parent.children[key];
      if (!node) {
        node = {
          type: "file",
          permissions: 0o644,
          content: String(STR2 || ""),
          ctime: now,
          mtime: now,
        };
        parent.children[key] = node;
        parent.mtime = now;
      } else if (node.type === "file") {
        node.content = String(STR2 || "");
        node.mtime = now;
        parent.mtime = now;
      } else {
        this.lastError = "Path is a directory";
      }
    }

    appendFile({ STR, STR2 }) {
      this.lastError = "";
      const { parent, key } = this._getParentAndKey(STR, false);
      if (!parent || !key) {
        this.lastError = "Path not found";
        return;
      }

      const now = Date.now();
      let node = parent.children[key];
      if (node && node.type === "file") {
        const existingContent = node.content ? String(node.content) : "";
        node.content = existingContent + String(STR2 || "");
        node.mtime = now;
        parent.mtime = now;
      } else if (!node) {
        this.lastError = "File not found";
      } else {
        this.lastError = "Path is a directory";
      }
    }

    readFile({ STR }) {
      this.lastError = "";
      const node = this._getNode(STR);
      if (!node) {
        this.lastError = "File not found";
        return "";
      }
      if (node.type !== "file") {
        this.lastError = "Path is a directory";
        return "";
      }
      return node.content ? String(node.content) : "";
    }

    remove({ STR }) {
      this.lastError = "";
      const normPath = this._normalizePath(STR);
      if (normPath === "/") {
        this.lastError = "Cannot remove root";
        return;
      }
      const { parent, key } = this._getParentAndKey(normPath, false);
      if (!parent || !key || !Object.prototype.hasOwnProperty.call(parent.children, key)) {
        this.lastError = "Path not found";
        return;
      }
      delete parent.children[key];
      parent.mtime = Date.now();
    }

    move({ STR, STR2 }) {
      this.lastError = "";
      const normStr = this._normalizePath(STR);
      const normStr2 = this._normalizePath(STR2);

      if (normStr === "/" || normStr2 === "/") {
        this.lastError = "Cannot move root";
        return;
      }
      if (normStr2.startsWith(normStr + "/")) {
        this.lastError = "Cannot move a directory into itself";
        return;
      }

      const { parent: srcParent, key: srcKey } = this._getParentAndKey(normStr);
      if (
        !srcParent ||
        !srcKey ||
        !Object.prototype.hasOwnProperty.call(srcParent.children, srcKey)
      ) {
        this.lastError = "Source path not found";
        return;
      }
      const nodeToMove = srcParent.children[srcKey];

      const { parent: destParent, key: destKey } = this._getParentAndKey(
        normStr2,
        true
      );
      if (!destParent || !destKey) {
        this.lastError = "Invalid destination path";
        return;
      }

      if (Object.prototype.hasOwnProperty.call(destParent.children, destKey)) {
        this.lastError = "Destination path already exists";
        return;
      }

      const now = Date.now();
      destParent.children[destKey] = nodeToMove;
      nodeToMove.mtime = now;
      destParent.mtime = now;

      delete srcParent.children[srcKey];
      srcParent.mtime = now;
    }

    copy({ STR, STR2 }) {
      this.lastError = "";
      const normStr = this._normalizePath(STR);
      const normStr2 = this._normalizePath(STR2);

      if (normStr === "/") {
        this.lastError = "Cannot copy root";
        return;
      }
      if (normStr2.startsWith(normStr + "/")) {
        this.lastError = "Cannot copy a directory into itself";
        return;
      }

      const nodeToCopy = this._getNode(normStr);
      if (!nodeToCopy) {
        this.lastError = "Source path not found";
        return;
      }

      const { parent: destParent, key: destKey } = this._getParentAndKey(
        normStr2,
        true
      );
      if (!destParent || !destKey) {
        this.lastError = "Invalid destination path";
        return;
      }

      if (Object.prototype.hasOwnProperty.call(destParent.children, destKey)) {
        this.lastError = "Destination path already exists";
        return;
      }

      destParent.children[destKey] = this._deepCopyNode(nodeToCopy);
      destParent.mtime = Date.now();
    }

    rename({ STR, STR2, OVER }) {
      this.lastError = "";
      const overwrite = String(OVER || "false").toLowerCase() === "true";
      const normSrc = this._normalizePath(STR);
      const normDst = this._normalizePath(STR2);

      if (normSrc === "/" || normDst === "/") {
        this.lastError = "Cannot rename root";
        return;
      }
      if (normDst.startsWith(normSrc + "/")) {
        this.lastError = "Cannot rename a directory into itself";
        return;
      }

      const { parent: srcParent, key: srcKey } = this._getParentAndKey(normSrc);
      if (!srcParent || !srcKey || !Object.prototype.hasOwnProperty.call(srcParent.children, srcKey)) {
        this.lastError = "Source path not found";
        return;
      }

      const nodeToRename = srcParent.children[srcKey];

      const { parent: destParent, key: destKey } = this._getParentAndKey(normDst, true);
      if (!destParent || !destKey) {
        this.lastError = "Invalid destination path";
        return;
      }

      if (Object.prototype.hasOwnProperty.call(destParent.children, destKey) && !overwrite) {
        this.lastError = "Destination path already exists";
        return;
      }

      if (Object.prototype.hasOwnProperty.call(destParent.children, destKey) && overwrite) {
        delete destParent.children[destKey];
      }

      destParent.children[destKey] = nodeToRename;
      destParent.mtime = Date.now();

      delete srcParent.children[srcKey];
      srcParent.mtime = Date.now();
    }

    list({ STR, TYPE }) {
      this.lastError = "";
      const normStr = this._normalizePath(STR);
      const node = this._getNode(normStr);
      if (!node) {
        this.lastError = "Path not found";
        return "[]";
      }
      if (node.type !== "directory") {
        this.lastError = "Path is a file";
        return "[]";
      }

      const results = [];
      const children = node.children;
      for (const key in children) {
        if (Object.prototype.hasOwnProperty.call(children, key)) {
          const child = children[key];
          const fullPath = (normStr === "/" ? "/" : normStr + "/") + key;
          if (TYPE === "files" && child.type === "file") {
            results.push(fullPath);
          } else if (TYPE === "directories" && child.type === "directory") {
            results.push(fullPath);
          } else if (TYPE === "both") {
            results.push(fullPath);
          }
        }
      }
      return JSON.stringify(results);
    }

    pathExists({ STR }) {
      this.lastError = "";
      return this._getNode(STR) !== null;
    }

    getPathType({ STR }) {
      this.lastError = "";
      const node = this._getNode(STR);
      if (!node) return "none";
      return node.type;
    }

    chmod({ STR, MODE, DEPTH }) {
      this.lastError = "";
      const node = this._getNode(STR);
      if (!node) {
        this.lastError = "Path not found";
        return;
      }

      const newPerms = parseInt(String(MODE || ""), 8);
      if (isNaN(newPerms)) {
        this.lastError = "Invalid permission mode";
        return;
      }

      let depth;
      if (typeof DEPTH === "undefined" || DEPTH === null || String(DEPTH).trim() === "") {
        depth = -1; 
      } else {
        const d = parseInt(String(DEPTH), 10);
        if (isNaN(d)) {
          this.lastError = "Invalid depth";
          return;
        }
        depth = d;
      }

      this._recursiveChmod(node, newPerms, depth);
    }

    touch({ STR }) {
      this.lastError = "";
      const node = this._getNode(STR);
      if (!node) {
        this.createFile({ STR });
        return;
      }
      const now = Date.now();
      node.mtime = now;

      const { parent } = this._getParentAndKey(STR, false);
      if (parent) {
        parent.mtime = now;
      }
    }

    getSize({ STR }) {
      this.lastError = "";
      const node = this._getNode(STR);
      if (!node) {
        this.lastError = "Path not found";
        return 0;
      }
      if (node.type === "file") {
        const content = node.content ? String(node.content) : "";
        return new TextEncoder().encode(content).length;
      }
      if (node.type === "directory") {
        return Object.keys(node.children).length;
      }
      return 0;
    }

    getCTime({ STR }) {
      this.lastError = "";
      const node = this._getNode(STR);
      if (!node) {
        this.lastError = "Path not found";
        return 0;
      }
      return node.ctime || 0;
    }

    getMTime({ STR }) {
      this.lastError = "";
      const node = this._getNode(STR);
      if (!node) {
        this.lastError = "Path not found";
        return 0;
      }
      return node.mtime || 0;
    }

    joinPath({ STR, STR2 }) {
      let part1 = String(STR || "/").replace(/\/+$/, "");
      let part2 = String(STR2 || "").replace(/^\/+/, "");

      if (!part1) part1 = "/";
      if (part1 === "/") {
        if (!part2) return "/";
        return "/" + part2;
      }
      if (!part2) return part1;
      return part1 + "/" + part2;
    }

    getBasename({ STR }) {
      const normPath = this._normalizePath(STR);
      if (normPath === "/") return "/";
      const parts = normPath.split("/");
      return parts[parts.length - 1];
    }

    getDirname({ STR }) {
      const normPath = this._normalizePath(STR);
      if (normPath === "/") return "/";
      const parts = normPath.split("/");
      parts.pop();
      if (parts.length === 1 && parts[0] === "") return "/";
      return parts.join("/") || "/";
    }

    getExtension({ STR }) {
      const basename = this.getBasename({ STR });
      if (basename === "/" || !basename.includes(".")) return "";
      const parts = basename.split(".");
      if (parts.length > 1 && parts[0] !== "") {
        return "." + parts.pop();
      }
      return "";
    }

    async webin({ STR }) {
      this.lastError = "";
      try {
        const response = await Scratch.fetch(String(STR || ""));

        if (!response || typeof response.text !== "function") {
          this.lastError = "Web request failed";
          return "";
        }
        const text = await response.text();
        return text;
      } catch (error) {
        console.error("rxFS+: webin error", error);
        this.lastError = "Web request failed";
        return "";
      }
    }

    in({ STR }) {
      this.lastError = "";
      try {
        const decompressed = LZString.decompressFromBase64(String(STR || ""));
        if (decompressed === null) {
          this.lastError = "Decompression failed (null)";
          return;
        }
        let importedFS;
        try {
          importedFS = JSON.parse(decompressed);
        } catch (e) {
          this.lastError = "Failed to parse FS JSON";
          console.error("rxFS+: Failed to parse FS JSON:", e);
          return;
        }

        if (
          importedFS &&
          importedFS.type === "directory" &&
          typeof importedFS.children === "object" &&
          importedFS.children !== null
        ) {
          fsRoot = importedFS;
        } else {
          this.lastError = "Invalid FS data structure";
          console.error("rxFS+: Invalid FS data to import.");
        }
      } catch (e) {
        this.lastError = "Failed to parse or decompress FS data";
        console.error("rxFS+: Failed to parse FS data:", e);
      }
    }

    out() {
      this.lastError = "";
      try {
        const jsonString = JSON.stringify(fsRoot);
        return LZString.compressToBase64(jsonString);
      } catch (e) {
        this.lastError = "Failed to stringify or compress FS";
        console.error("rxFS+: out error", e);
        return "";
      }
    }

    getLastError() {
      return this.lastError;
    }
  }

  Scratch.extensions.register(new rxFSPlus());
})(Scratch);
