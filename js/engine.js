// Motor de fórmulas tipo Excel para el simulador.
// Valores: number | string | boolean | null (celda vacía) | XErr | M (matriz)
(function () {
  class XErr {
    constructor(code, msg) { this.code = code; this.msg = msg || ''; }
  }
  class ParseError extends Error {
    constructor(msg) { super(msg); this.code = '#ERROR'; }
  }
  class M {
    constructor(r, c, v) { this.r = r; this.c = c; this.v = v; }
    get(i, j) { return this.v[i * this.c + j]; }
    rowAt(i) { return this.v.slice(i * this.c, i * this.c + this.c); }
    colAt(j) { const out = []; for (let i = 0; i < this.r; i++) out.push(this.get(i, j)); return out; }
  }
  const isM = (x) => x instanceof M;
  const isE = (x) => x instanceof XErr;
  const colM = (a) => new M(a.length, 1, a.slice());
  const rowM = (a) => new M(1, a.length, a.slice());
  const scalarize = (x) => (isM(x) && x.r === 1 && x.c === 1 ? x.v[0] : x);

  const ERR = {
    value: (m) => new XErr('#VALUE!', m || 'Tipo de dato incorrecto (texto donde iba número, o rangos de distinto tamaño).'),
    na: (m) => new XErr('#N/A', m || 'No se encontró el valor buscado.'),
    div: () => new XErr('#DIV/0!', 'División entre cero (o promedio de nada).'),
    name: (m) => new XErr('#NAME?', m),
    num: (m) => new XErr('#NUM!', m || 'Número inválido para esta función.'),
    calc: (m) => new XErr('#CALC!', m || 'El resultado está vacío.'),
    ref: (m) => new XErr('#REF!', m || 'Referencia inválida.'),
  };

  // Nombres en español -> inglés (Excel en español)
  const ES = {
    'SUMA': 'SUM', 'PROMEDIO': 'AVERAGE', 'MEDIANA': 'MEDIAN', 'CONTAR': 'COUNT', 'CONTARA': 'COUNTA',
    'CONTAR.BLANCO': 'COUNTBLANK', 'SI': 'IF', 'SI.CONJUNTO': 'IFS', 'Y': 'AND', 'O': 'OR', 'NO': 'NOT',
    'SI.ERROR': 'IFERROR', 'SI.ND': 'IFNA', 'CAMBIAR': 'SWITCH', 'ESBLANCO': 'ISBLANK', 'ESNUMERO': 'ISNUMBER',
    'ESTEXTO': 'ISTEXT', 'ESERROR': 'ISERROR', 'ESNOD': 'ISNA', 'SUMAR.SI': 'SUMIF', 'SUMAR.SI.CONJUNTO': 'SUMIFS',
    'CONTAR.SI': 'COUNTIF', 'CONTAR.SI.CONJUNTO': 'COUNTIFS', 'PROMEDIO.SI': 'AVERAGEIF',
    'PROMEDIO.SI.CONJUNTO': 'AVERAGEIFS', 'MAX.SI.CONJUNTO': 'MAXIFS', 'MIN.SI.CONJUNTO': 'MINIFS',
    'SUMAPRODUCTO': 'SUMPRODUCT', 'BUSCARX': 'XLOOKUP', 'BUSCARV': 'VLOOKUP', 'INDICE': 'INDEX', 'ÍNDICE': 'INDEX',
    'COINCIDIR': 'MATCH', 'COINCIDIRX': 'XMATCH', 'ESPACIOS': 'TRIM', 'LIMPIAR': 'CLEAN', 'MAYUSC': 'UPPER',
    'MINUSC': 'LOWER', 'NOMPROPIO': 'PROPER', 'IZQUIERDA': 'LEFT', 'DERECHA': 'RIGHT', 'EXTRAE': 'MID',
    'LARGO': 'LEN', 'ENCONTRAR': 'FIND', 'HALLAR': 'SEARCH', 'SUSTITUIR': 'SUBSTITUTE', 'CONCAT': 'CONCAT',
    'CONCATENAR': 'CONCATENATE', 'UNIRCADENAS': 'TEXTJOIN', 'DIVIDIRTEXTO': 'TEXTSPLIT', 'VALOR': 'VALUE',
    'TEXTO': 'TEXT', 'HOY': 'TODAY', 'AÑO': 'YEAR', 'MES': 'MONTH', 'DIA': 'DAY', 'DÍA': 'DAY',
    'FIN.MES': 'EOMONTH', 'FECHA.MES': 'EDATE', 'SIFECHA': 'DATEDIF', 'DIAS.LAB': 'NETWORKDAYS',
    'DIASEM': 'WEEKDAY', 'FECHA': 'DATE', 'DIAS': 'DAYS', 'FILTRAR': 'FILTER', 'ORDENAR': 'SORT',
    'ORDENARPOR': 'SORTBY', 'UNICOS': 'UNIQUE', 'ÚNICOS': 'UNIQUE', 'SECUENCIA': 'SEQUENCE', 'LET': 'LET',
    'JERARQUIA.EQV': 'RANK.EQ', 'JERARQUIA': 'RANK', 'K.ESIMO.MAYOR': 'LARGE', 'K.ESIMO.MENOR': 'SMALL',
    'PERCENTIL.INC': 'PERCENTILE.INC', 'PERCENTIL': 'PERCENTILE', 'DESVEST.M': 'STDEV.S', 'DESVEST': 'STDEV',
    'DESVEST.P': 'STDEV.P', 'COEF.DE.CORREL': 'CORREL', 'REDONDEAR': 'ROUND', 'REDONDEAR.MAS': 'ROUNDUP',
    'REDONDEAR.MENOS': 'ROUNDDOWN', 'ENTERO': 'INT', 'RESIDUO': 'MOD', 'FILAS': 'ROWS', 'COLUMNAS': 'COLUMNS',
    'TOMAR': 'TAKE', 'ELEGIRCOLS': 'CHOOSECOLS', 'TRANSPONER': 'TRANSPOSE', 'VERDADERO': 'TRUE', 'FALSO': 'FALSE',
    'CUARTIL.INC': 'QUARTILE.INC', 'VAR.S': 'VAR.S', 'ABS': 'ABS',
  };

  const SIG = {
    SUM: 'SUM(número1, [número2], ...)', AVERAGE: 'AVERAGE(número1, [número2], ...)', MEDIAN: 'MEDIAN(número1, ...)',
    MIN: 'MIN(número1, ...)', MAX: 'MAX(número1, ...)', COUNT: 'COUNT(valor1, ...)', COUNTA: 'COUNTA(valor1, ...)',
    COUNTBLANK: 'COUNTBLANK(rango)', IF: 'IF(prueba_lógica, valor_si_verdadero, [valor_si_falso])',
    IFS: 'IFS(prueba1, valor1, [prueba2, valor2], ...)', AND: 'AND(lógico1, [lógico2], ...)', OR: 'OR(lógico1, [lógico2], ...)',
    NOT: 'NOT(lógico)', IFERROR: 'IFERROR(valor, valor_si_error)', IFNA: 'IFNA(valor, valor_si_na)',
    SWITCH: 'SWITCH(expresión, valor1, resultado1, ..., [por_defecto])', ISBLANK: 'ISBLANK(valor)', ISNUMBER: 'ISNUMBER(valor)',
    ISTEXT: 'ISTEXT(valor)', ISERROR: 'ISERROR(valor)', ISNA: 'ISNA(valor)',
    SUMIF: 'SUMIF(rango, criterio, [rango_suma])', SUMIFS: 'SUMIFS(rango_suma, rango_criterio1, criterio1, ...)',
    COUNTIF: 'COUNTIF(rango, criterio)', COUNTIFS: 'COUNTIFS(rango_criterio1, criterio1, ...)',
    AVERAGEIF: 'AVERAGEIF(rango, criterio, [rango_promedio])', AVERAGEIFS: 'AVERAGEIFS(rango_promedio, rango_criterio1, criterio1, ...)',
    MAXIFS: 'MAXIFS(rango_max, rango_criterio1, criterio1, ...)', MINIFS: 'MINIFS(rango_min, rango_criterio1, criterio1, ...)',
    SUMPRODUCT: 'SUMPRODUCT(matriz1, [matriz2], ...)',
    XLOOKUP: 'XLOOKUP(buscar, matriz_busqueda, matriz_devuelta, [si_no_encuentra], [modo_coincidencia], [modo_busqueda])',
    VLOOKUP: 'VLOOKUP(buscar, tabla, núm_columna, [aproximado])', INDEX: 'INDEX(matriz, núm_fila, [núm_columna])',
    MATCH: 'MATCH(buscar, matriz, [tipo_coincidencia])', XMATCH: 'XMATCH(buscar, matriz, [modo_coincidencia], [modo_busqueda])',
    TRIM: 'TRIM(texto)', CLEAN: 'CLEAN(texto)', UPPER: 'UPPER(texto)', LOWER: 'LOWER(texto)', PROPER: 'PROPER(texto)',
    LEFT: 'LEFT(texto, [núm_caracteres])', RIGHT: 'RIGHT(texto, [núm_caracteres])', MID: 'MID(texto, inicio, núm_caracteres)',
    LEN: 'LEN(texto)', FIND: 'FIND(buscar, dentro_de, [inicio])', SEARCH: 'SEARCH(buscar, dentro_de, [inicio])',
    SUBSTITUTE: 'SUBSTITUTE(texto, texto_viejo, texto_nuevo, [instancia])', CONCAT: 'CONCAT(texto1, ...)',
    CONCATENATE: 'CONCATENATE(texto1, ...)', TEXTJOIN: 'TEXTJOIN(delimitador, ignorar_vacíos, texto1, ...)',
    TEXTSPLIT: 'TEXTSPLIT(texto, delimitador_col, [delimitador_fila])', VALUE: 'VALUE(texto)', TEXT: 'TEXT(valor, formato)',
    TODAY: 'TODAY()', YEAR: 'YEAR(fecha)', MONTH: 'MONTH(fecha)', DAY: 'DAY(fecha)', DATE: 'DATE(año, mes, día)',
    EOMONTH: 'EOMONTH(fecha_inicio, meses)', EDATE: 'EDATE(fecha_inicio, meses)', DATEDIF: 'DATEDIF(inicio, fin, "y"|"m"|"d")',
    NETWORKDAYS: 'NETWORKDAYS(inicio, fin, [feriados])', WEEKDAY: 'WEEKDAY(fecha, [tipo])', DAYS: 'DAYS(fin, inicio)',
    FILTER: 'FILTER(matriz, incluir, [si_vacío])', SORT: 'SORT(matriz, [índice], [orden], [por_col])',
    SORTBY: 'SORTBY(matriz, por_matriz1, [orden1], ...)', UNIQUE: 'UNIQUE(matriz, [por_col], [exactamente_una_vez])',
    SEQUENCE: 'SEQUENCE(filas, [columnas], [inicio], [paso])', LET: 'LET(nombre1, valor1, ..., cálculo)',
    'RANK.EQ': 'RANK.EQ(número, ref, [orden])', RANK: 'RANK(número, ref, [orden])', LARGE: 'LARGE(matriz, k)', SMALL: 'SMALL(matriz, k)',
    'PERCENTILE.INC': 'PERCENTILE.INC(matriz, k)', 'STDEV.S': 'STDEV.S(número1, ...)', 'STDEV.P': 'STDEV.P(número1, ...)',
    CORREL: 'CORREL(matriz1, matriz2)', ROUND: 'ROUND(número, decimales)', ROUNDUP: 'ROUNDUP(número, decimales)',
    ROUNDDOWN: 'ROUNDDOWN(número, decimales)', INT: 'INT(número)', MOD: 'MOD(número, divisor)', ABS: 'ABS(número)',
    ROWS: 'ROWS(matriz)', COLUMNS: 'COLUMNS(matriz)', TAKE: 'TAKE(matriz, filas, [columnas])',
    CHOOSECOLS: 'CHOOSECOLS(matriz, col1, [col2], ...)', TRANSPOSE: 'TRANSPOSE(matriz)', 'QUARTILE.INC': 'QUARTILE.INC(matriz, cuartil)',
  };

  const canon = (name) => {
    const u = name.toUpperCase();
    return ES[u] || u;
  };

  // Tokenizer
  function tokenize(src) {
    const s = src.replace(/^\s*=/, '');
    const semi = s.includes(';');
    const t = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '"') {
        let j = i + 1, v = '';
        for (;;) {
          if (j >= s.length) throw new ParseError('Te falta cerrar unas comillas ".');
          if (s[j] === '"') { if (s[j + 1] === '"') { v += '"'; j += 2; continue; } break; }
          v += s[j++];
        }
        t.push({ k: 'str', v }); i = j + 1; continue;
      }
      const numRe = semi ? /^(\d+(?:[.,]\d+)?|[.,]\d+)(?:[eE][+-]?\d+)?/ : /^(\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;
      if (/[0-9.]/.test(c)) {
        const m = s.slice(i).match(numRe);
        if (m) { t.push({ k: 'num', v: Number(m[0].replace(',', '.')) }); i += m[0].length; continue; }
      }
      if (c === '[') {
        throw new ParseError('En el simulador no existe "fila actual". Usa la columna completa: tblVentas[Columna] (sin @).');
      }
      const id = s.slice(i).match(/^[A-Za-zÁÉÍÓÚÑáéíóúñ_][A-Za-z0-9ÁÉÍÓÚÑáéíóúñ_.]*/);
      if (id) {
        i += id[0].length;
        if (s[i] === '[') {
          let depth = 0, j = i, inner = '';
          for (; j < s.length; j++) {
            if (s[j] === '[') { depth++; if (depth === 1) continue; }
            if (s[j] === ']') { depth--; if (depth === 0) break; }
            inner += s[j];
          }
          if (depth !== 0) throw new ParseError('Te falta cerrar un corchete ] en la referencia de tabla.');
          if (inner.trim().startsWith('@')) {
            throw new ParseError('Quita el @: en el simulador se trabaja con la columna completa, ej. ' + id[0] + '[' + inner.trim().slice(1) + '].');
          }
          t.push({ k: 'ref', table: id[0], col: inner.replace(/^\[|\]$/g, '').trim() });
          i = j + 1; continue;
        }
        t.push({ k: 'id', v: id[0] }); continue;
      }
      const two = s.slice(i, i + 2);
      if (two === '<=' || two === '>=' || two === '<>') { t.push({ k: 'op', v: two }); i += 2; continue; }
      if ('+-*/^&=<>%'.includes(c)) { t.push({ k: 'op', v: c }); i++; continue; }
      if (c === '(' || c === ')' || c === '{' || c === '}') { t.push({ k: c }); i++; continue; }
      if (c === ',' || c === ';') {
        // Dentro de {} la ; separa filas
        t.push({ k: 'sep', v: c }); i++; continue;
      }
      throw new ParseError('Carácter inesperado: ' + c);
    }
    return { tokens: t, semi };
  }

  function parse(src) {
    const { tokens, semi } = tokenize(src);
    let p = 0;
    const peek = () => tokens[p];
    const next = () => tokens[p++];
    const isOp = (...ops) => peek() && peek().k === 'op' && ops.includes(peek().v);

    function expr() { return comparison(); }
    function comparison() {
      let l = concat();
      while (isOp('=', '<>', '<', '>', '<=', '>=')) { const op = next().v; l = { k: 'bin', op, l, r: concat() }; }
      return l;
    }
    function concat() {
      let l = additive();
      while (isOp('&')) { next(); l = { k: 'bin', op: '&', l, r: additive() }; }
      return l;
    }
    function additive() {
      let l = mult();
      while (isOp('+', '-')) { const op = next().v; l = { k: 'bin', op, l, r: mult() }; }
      return l;
    }
    function mult() {
      let l = power();
      while (isOp('*', '/')) { const op = next().v; l = { k: 'bin', op, l, r: power() }; }
      return l;
    }
    function power() {
      let l = unary();
      while (isOp('^')) { next(); l = { k: 'bin', op: '^', l, r: unary() }; }
      return l;
    }
    function unary() {
      if (isOp('-')) { next(); return { k: 'neg', e: unary() }; }
      if (isOp('+')) { next(); return unary(); }
      let e = primary();
      while (isOp('%')) { next(); e = { k: 'bin', op: '/', l: e, r: { k: 'num', v: 100 } }; }
      return e;
    }
    function primary() {
      const tk = next();
      if (!tk) throw new ParseError('La fórmula está incompleta.');
      if (tk.k === 'num') return { k: 'num', v: tk.v };
      if (tk.k === 'str') return { k: 'str', v: tk.v };
      if (tk.k === 'ref') return { k: 'ref', table: tk.table, col: tk.col };
      if (tk.k === '(') {
        const e = expr();
        if (!peek() || peek().k !== ')') throw new ParseError('Te falta cerrar un paréntesis ).');
        next(); return e;
      }
      if (tk.k === '{') {
        const rows = [[]];
        for (;;) {
          const t2 = next();
          if (!t2) throw new ParseError('Te falta cerrar la llave }.');
          if (t2.k === '}') break;
          if (t2.k === 'sep') { if (t2.v === ';') rows.push([]); continue; }
          let v;
          if (t2.k === 'num') v = t2.v;
          else if (t2.k === 'str') v = t2.v;
          else if (t2.k === 'op' && t2.v === '-' && peek() && peek().k === 'num') v = -next().v;
          else if (t2.k === 'id' && /^(TRUE|FALSE|VERDADERO|FALSO)$/i.test(t2.v)) v = /^(TRUE|VERDADERO)$/i.test(t2.v);
          else throw new ParseError('Dentro de { } solo van valores fijos.');
          rows[rows.length - 1].push(v);
        }
        const c = rows[0].length;
        if (rows.some((r) => r.length !== c)) throw new ParseError('Las filas de la matriz { } deben tener el mismo tamaño.');
        return { k: 'arr', m: new M(rows.length, c, rows.flat()) };
      }
      if (tk.k === 'id') {
        if (peek() && peek().k === '(') {
          next();
          const args = [];
          if (peek() && peek().k === ')') { next(); return { k: 'fn', name: canon(tk.v), raw: tk.v, args }; }
          for (;;) {
            if (peek() && (peek().k === 'sep' || peek().k === ')')) args.push({ k: 'miss' });
            else args.push(expr());
            const t3 = next();
            if (!t3) throw new ParseError('Te falta cerrar el paréntesis de ' + tk.v.toUpperCase() + '.');
            if (t3.k === ')') break;
            if (t3.k !== 'sep') throw new ParseError('Esperaba una coma o un paréntesis después de un argumento de ' + tk.v.toUpperCase() + '.');
          }
          return { k: 'fn', name: canon(tk.v), raw: tk.v, args };
        }
        const u = canon(tk.v);
        if (u === 'TRUE') return { k: 'bool', v: true };
        if (u === 'FALSE') return { k: 'bool', v: false };
        return { k: 'name', v: tk.v };
      }
      if (tk.k === ')') throw new ParseError('Sobra un paréntesis ) o falta un argumento.');
      throw new ParseError('No entiendo esta parte de la fórmula.');
    }
    const ast = expr();
    if (p < tokens.length) {
      const t = tokens[p];
      if (t.k === ')') throw new ParseError('Sobra un paréntesis ).');
      if (t.k === 'sep') throw new ParseError('Hay una coma fuera de una función. ¿Te faltó el nombre de la función?');
      throw new ParseError('Sobra algo al final de la fórmula.');
    }
    return { ast, semi };
  }

  // Fechas (serial de Excel)
  const EPOCH = Date.UTC(1899, 11, 30);
  const toSerial = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86400000);
  const fromSerial = (n) => new Date(EPOCH + Math.floor(n) * 86400000);

  // Coerciones
  function num(v) {
    if (isE(v)) return v;
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v === null || v === undefined) return 0;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t !== '' && !isNaN(Number(t))) return Number(t);
      return ERR.value('No se puede usar el texto "' + v + '" como número.');
    }
    return ERR.value();
  }
  function fmtNum(n) {
    if (!isFinite(n)) return String(n);
    if (Number.isInteger(n)) return String(n);
    return String(Number(n.toPrecision(12)));
  }
  function str(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return fmtNum(v);
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return String(v);
  }
  function truthy(v) {
    if (isE(v)) return v;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (v === null) return false;
    if (typeof v === 'string') {
      if (/^true$/i.test(v)) return true;
      if (/^false$/i.test(v)) return false;
      return ERR.value('Una prueba lógica no puede ser el texto "' + v + '".');
    }
    return false;
  }
  const typeRank = (v) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2);
  function cmp(a, b) {
    if (a === null) a = typeof b === 'string' ? '' : 0;
    if (b === null) b = typeof a === 'string' ? '' : 0;
    const ra = typeRank(a), rb = typeRank(b);
    if (ra !== rb) return ra - rb;
    if (typeof a === 'string') {
      const x = a.toLowerCase(), y = b.toLowerCase();
      return x < y ? -1 : x > y ? 1 : 0;
    }
    if (typeof a === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
    return Math.abs(a - b) < 1e-12 ? 0 : a - b;
  }

  // Elementwise con broadcasting
  function lift(args, f) {
    const ms = args.filter(isM);
    if (!ms.length) return f(...args);
    const R = Math.max(...ms.map((m) => m.r)), C = Math.max(...ms.map((m) => m.c));
    const out = [];
    for (let i = 0; i < R; i++) {
      for (let j = 0; j < C; j++) {
        const a = args.map((x) => {
          if (!isM(x)) return x;
          if ((x.r !== 1 && x.r !== R) || (x.c !== 1 && x.c !== C)) return ERR.na('Rangos de distinto tamaño.');
          return x.get(x.r === 1 ? 0 : i, x.c === 1 ? 0 : j);
        });
        const bad = a.find(isE);
        out.push(bad && f.propagate !== false ? bad : f(...a));
      }
    }
    return new M(R, C, out);
  }
  const S = (f) => (...args) => lift(args, (...a) => { const e = a.find(isE); return e || f(...a); });
  const SE = (f) => { f.propagate = false; return (...args) => lift(args, f); }; // no propaga errores (ISNUMBER, ISERROR...)

  function binop(op, a, b) {
    return lift([a, b], (x, y) => {
      if (isE(x)) return x;
      if (isE(y)) return y;
      switch (op) {
        case '+': case '-': case '*': case '/': case '^': {
          const p = num(x), q = num(y);
          if (isE(p)) return p;
          if (isE(q)) return q;
          if (op === '+') return p + q;
          if (op === '-') return p - q;
          if (op === '*') return p * q;
          if (op === '/') return q === 0 ? ERR.div() : p / q;
          return Math.pow(p, q);
        }
        case '&': return str(x) + str(y);
        case '=': return cmp(x, y) === 0;
        case '<>': return cmp(x, y) !== 0;
        case '<': return cmp(x, y) < 0;
        case '>': return cmp(x, y) > 0;
        case '<=': return cmp(x, y) <= 0;
        case '>=': return cmp(x, y) >= 0;
      }
      return ERR.value();
    });
  }

  function flat(args, opts = {}) {
    // Devuelve lista de valores para agregados. Escalar directo: se convierte; dentro de rangos solo números.
    const out = [];
    for (const a of args) {
      if (a === undefined) continue;
      if (isM(a)) {
        for (const v of a.v) {
          if (isE(v)) return v;
          if (typeof v === 'number') out.push(v);
          else if (opts.all) out.push(v);
        }
      } else {
        if (isE(a)) return a;
        if (opts.all) { out.push(a); continue; }
        const n = num(a);
        if (isE(n)) return n;
        out.push(n);
      }
    }
    return out;
  }
  const vec = (x) => (isM(x) ? x.v : [x]);

  function wildRe(pattern) {
    let re = '';
    for (let i = 0; i < pattern.length; i++) {
      const c = pattern[i];
      if (c === '~' && i + 1 < pattern.length) { re += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); continue; }
      if (c === '*') re += '.*';
      else if (c === '?') re += '.';
      else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp('^' + re + '$', 'is');
  }

  function crit(c) {
    if (isM(c)) c = c.v[0];
    if (isE(c)) return () => false;
    if (c === undefined || c === null) return (v) => v === null || v === '';
    if (typeof c === 'number' || typeof c === 'boolean') return (v) => v !== null && typeRank(v) === typeRank(c) && cmp(v, c) === 0;
    const m = String(c).match(/^(<=|>=|<>|<|>|=)?([\s\S]*)$/);
    const op = m[1] || '=';
    const rest = m[2];
    const isNum = rest.trim() !== '' && !isNaN(Number(rest));
    if (isNum) {
      const n = Number(rest);
      const f = { '=': (x) => x === 0, '<>': (x) => x !== 0, '<': (x) => x < 0, '>': (x) => x > 0, '<=': (x) => x <= 0, '>=': (x) => x >= 0 }[op];
      return (v) => {
        if (typeof v === 'number') return f(Math.abs(v - n) < 1e-12 ? 0 : v - n);
        if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return f(Number(v) - n);
        return op === '<>';
      };
    }
    if (op === '=' || op === '<>') {
      if (rest === '') return op === '=' ? (v) => v === null || v === '' : (v) => !(v === null || v === '');
      const re = wildRe(rest);
      const t = (v) => v !== null && re.test(str(v));
      return op === '=' ? t : (v) => !t(v);
    }
    const f = { '<': (x) => x < 0, '>': (x) => x > 0, '<=': (x) => x <= 0, '>=': (x) => x >= 0 }[op];
    return (v) => typeof v === 'string' && f(cmp(v, rest));
  }

  function needRange(x, fname, pos) {
    if (!isM(x)) return ERR.value(fname + ': el argumento ' + pos + ' debe ser un rango o columna (ej. tblVentas[Vendedor]), no un valor suelto.');
    return null;
  }

  function ifsMask(ctx, fname, pairs, len, startPos) {
    if (pairs.length % 2 !== 0) return ERR.value(fname + ': cada rango de criterio necesita su criterio (van en pares).');
    let mask = new Array(len).fill(true);
    for (let k = 0; k < pairs.length; k += 2) {
      const r = pairs[k];
      const bad = needRange(r, fname, startPos + k);
      if (bad) return bad;
      if (r.v.length !== len) return ERR.value(fname + ': todos los rangos deben tener el mismo tamaño.');
      const f = crit(pairs[k + 1]);
      mask = mask.map((m, i) => m && f(r.v[i]));
    }
    ctx.mask = mask;
    return mask;
  }

  function median(a) {
    const s = a.slice().sort((x, y) => x - y);
    const n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  function percentileInc(a, k) {
    const s = a.slice().sort((x, y) => x - y);
    const h = (s.length - 1) * k;
    const lo = Math.floor(h);
    return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]);
  }
  function stdev(a, sample) {
    const n = a.length;
    if (n < (sample ? 2 : 1)) return ERR.div();
    const m = a.reduce((x, y) => x + y, 0) / n;
    const ss = a.reduce((x, y) => x + (y - m) ** 2, 0);
    return Math.sqrt(ss / (sample ? n - 1 : n));
  }
  function roundTo(n, d, mode) {
    const f = Math.pow(10, d);
    const x = n * f;
    let r;
    if (mode === 'up') r = Math.sign(x) * Math.ceil(Math.abs(x) - 1e-9);
    else if (mode === 'down') r = Math.sign(x) * Math.floor(Math.abs(x) + 1e-9);
    else r = Math.sign(x) * Math.round(Math.abs(x) + 1e-9);
    return r / f;
  }

  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function textFmt(v, f) {
    const fmt = String(f);
    if (/[dmy]/i.test(fmt) && !/[0#]/.test(fmt)) {
      const n = num(v);
      if (isE(n)) return n;
      const d = fromSerial(n);
      const Y = d.getUTCFullYear(), Mo = d.getUTCMonth(), D = d.getUTCDate(), W = d.getUTCDay();
      return fmt.replace(/yyyy|aaaa|yy|aa|mmmm|mmm|mm|m|dddd|ddd|dd|d/gi, (tk) => {
        switch (tk.toLowerCase()) {
          case 'yyyy': case 'aaaa': return String(Y);
          case 'yy': case 'aa': return String(Y).slice(2);
          case 'mmmm': return MONTHS[Mo];
          case 'mmm': return MONTHS[Mo].slice(0, 3);
          case 'mm': return String(Mo + 1).padStart(2, '0');
          case 'm': return String(Mo + 1);
          case 'dddd': return DAYS[W];
          case 'ddd': return DAYS[W].slice(0, 3);
          case 'dd': return String(D).padStart(2, '0');
          case 'd': return String(D);
        }
        return tk;
      });
    }
    const n = num(v);
    if (isE(n)) return n;
    const pct = fmt.includes('%');
    const x = pct ? n * 100 : n;
    const dec = (fmt.split('.')[1] || '').replace(/[^0#]/g, '').length;
    let s = Math.abs(x).toFixed(dec);
    if (fmt.includes(',')) {
      const [a, b] = s.split('.');
      s = a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : '');
    }
    const prefix = (fmt.match(/^[^0#,.]*/) || [''])[0].replace(/"/g, '');
    return (x < 0 ? '-' : '') + prefix + s + (pct ? '%' : '');
  }

  function lookupIndex(lv, arr, mode, searchRev) {
    const idx = [...arr.keys()];
    if (searchRev) idx.reverse();
    if (mode === 2 && typeof lv === 'string') {
      const re = wildRe(lv);
      for (const i of idx) if (arr[i] !== null && re.test(str(arr[i]))) return i;
      return -1;
    }
    for (const i of idx) if (arr[i] !== null && typeRank(arr[i]) === typeRank(lv) && cmp(arr[i], lv) === 0) return i;
    if (mode === -1 || mode === 1) {
      let best = -1;
      for (const i of idx) {
        const v = arr[i];
        if (v === null || typeRank(v) !== typeRank(lv)) continue;
        const c = cmp(v, lv);
        if (mode === -1 && c < 0 && (best < 0 || cmp(v, arr[best]) > 0)) best = i;
        if (mode === 1 && c > 0 && (best < 0 || cmp(v, arr[best]) < 0)) best = i;
      }
      return best;
    }
    return -1;
  }

  function toVecM(x) { return isM(x) ? x : new M(1, 1, [x]); }

  function sortRows(m, keyFns) {
    const rows = [...Array(m.r).keys()];
    rows.sort((a, b) => {
      for (const { key, ord } of keyFns) {
        const c = cmp(key(a), key(b));
        if (c !== 0) return ord * c;
      }
      return a - b;
    });
    return rows;
  }

  const F = {
    SUM: (...a) => { const l = flat(a); return isE(l) ? l : l.reduce((x, y) => x + y, 0); },
    AVERAGE: (...a) => { const l = flat(a); if (isE(l)) return l; return l.length ? l.reduce((x, y) => x + y, 0) / l.length : ERR.div(); },
    MIN: (...a) => { const l = flat(a); if (isE(l)) return l; return l.length ? Math.min(...l) : 0; },
    MAX: (...a) => { const l = flat(a); if (isE(l)) return l; return l.length ? Math.max(...l) : 0; },
    MEDIAN: (...a) => { const l = flat(a); if (isE(l)) return l; return l.length ? median(l) : ERR.num(); },
    COUNT: (...a) => { let n = 0; for (const x of a) for (const v of vec(x)) if (typeof v === 'number') n++; return n; },
    COUNTA: (...a) => { let n = 0; for (const x of a) { if (x === undefined) continue; for (const v of vec(x)) if (v !== null && v !== undefined) n++; } return n; },
    COUNTBLANK: (r) => vec(r).filter((v) => v === null || v === '').length,
    ROUND: S((n, d) => { const x = num(n), y = d === undefined ? 0 : num(d); return isE(x) ? x : isE(y) ? y : roundTo(x, y); }),
    ROUNDUP: S((n, d) => { const x = num(n), y = d === undefined ? 0 : num(d); return isE(x) ? x : isE(y) ? y : roundTo(x, y, 'up'); }),
    ROUNDDOWN: S((n, d) => { const x = num(n), y = d === undefined ? 0 : num(d); return isE(x) ? x : isE(y) ? y : roundTo(x, y, 'down'); }),
    INT: S((n) => { const x = num(n); return isE(x) ? x : Math.floor(x); }),
    ABS: S((n) => { const x = num(n); return isE(x) ? x : Math.abs(x); }),
    MOD: S((n, d) => { const x = num(n), y = num(d); if (isE(x)) return x; if (isE(y)) return y; return y === 0 ? ERR.div() : x - y * Math.floor(x / y); }),

    IF: (c, a, b) => lift([c, a === undefined ? true : a, b === undefined ? false : b], Object.assign((cv, av, bv) => {
      const t = truthy(cv); if (isE(t)) return t; return t ? (av === undefined ? true : av) : bv;
    }, { propagate: false })),
    IFS: (...a) => {
      if (a.length % 2 !== 0) return ERR.value('IFS: van en pares (prueba, valor).');
      return lift(a, Object.assign((...v) => {
        for (let k = 0; k < v.length; k += 2) { const t = truthy(v[k]); if (isE(t)) return t; if (t) return v[k + 1]; }
        return ERR.na('IFS: ninguna condición se cumplió. Agrega TRUE,"valor" al final como "en otro caso".');
      }, { propagate: false }));
    },
    AND: (...a) => { let any = false; for (const x of a) for (const v of vec(x)) { if (isE(v)) return v; if (typeof v === 'string' && isM(x)) continue; const t = truthy(v); if (isE(t)) return t; any = true; if (!t) return false; } return any ? true : ERR.value(); },
    OR: (...a) => { let any = false; for (const x of a) for (const v of vec(x)) { if (isE(v)) return v; if (typeof v === 'string' && isM(x)) continue; const t = truthy(v); if (isE(t)) return t; any = true; if (t) return true; } return any ? false : ERR.value(); },
    NOT: S((v) => { const t = truthy(v); return isE(t) ? t : !t; }),
    IFERROR: (v, alt) => lift([v, alt === undefined ? '' : alt], Object.assign((x, y) => (isE(x) ? y : x), { propagate: false })),
    IFNA: (v, alt) => lift([v, alt === undefined ? '' : alt], Object.assign((x, y) => (isE(x) && x.code === '#N/A' ? y : x), { propagate: false })),
    SWITCH: (e, ...rest) => lift([e, ...rest], (x, ...r) => {
      for (let k = 0; k + 1 < r.length; k += 2) if (cmp(x, r[k]) === 0 && typeRank(x) === typeRank(r[k])) return r[k + 1];
      return r.length % 2 === 1 ? r[r.length - 1] : ERR.na('SWITCH: ningún valor coincidió y no pusiste valor por defecto.');
    }),
    ISBLANK: SE((v) => v === null),
    ISNUMBER: SE((v) => typeof v === 'number'),
    ISTEXT: SE((v) => typeof v === 'string'),
    ISERROR: SE((v) => isE(v)),
    ISNA: SE((v) => isE(v) && v.code === '#N/A'),

    SUMIF(ctx, r, c, sr) {
      const bad = needRange(r, 'SUMIF', 1); if (bad) return bad;
      const target = sr === undefined ? r : sr;
      if (!isM(target) || target.v.length !== r.v.length) return ERR.value('SUMIF: el rango de suma debe tener el mismo tamaño que el rango.');
      const f = crit(c); let s = 0; const mask = [];
      r.v.forEach((v, i) => { const ok = f(v); mask.push(ok); if (ok && typeof target.v[i] === 'number') s += target.v[i]; });
      ctx.mask = mask; return s;
    },
    COUNTIF(ctx, r, c) {
      const bad = needRange(r, 'COUNTIF', 1); if (bad) return bad;
      if (isM(c) && c.v.length > 1) return lift([c], (cv) => r.v.filter(crit(cv)).length);
      const f = crit(c); const mask = r.v.map(f); ctx.mask = mask; return mask.filter(Boolean).length;
    },
    AVERAGEIF(ctx, r, c, ar) {
      const bad = needRange(r, 'AVERAGEIF', 1); if (bad) return bad;
      const target = ar === undefined ? r : ar;
      const f = crit(c); const vals = []; const mask = [];
      r.v.forEach((v, i) => { const ok = f(v); mask.push(ok); if (ok && typeof target.v[i] === 'number') vals.push(target.v[i]); });
      ctx.mask = mask; return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : ERR.div();
    },
    SUMIFS(ctx, t, ...pairs) {
      const bad = needRange(t, 'SUMIFS', 1); if (bad) return bad;
      if (!pairs.length) return ERR.value('SUMIFS: falta al menos un par (rango_criterio, criterio).');
      const m = ifsMask(ctx, 'SUMIFS', pairs, t.v.length, 2); if (isE(m)) return m;
      return t.v.reduce((s, v, i) => (m[i] && typeof v === 'number' ? s + v : s), 0);
    },
    COUNTIFS(ctx, ...pairs) {
      if (!pairs.length) return ERR.value();
      const bad = needRange(pairs[0], 'COUNTIFS', 1); if (bad) return bad;
      const m = ifsMask(ctx, 'COUNTIFS', pairs, pairs[0].v.length, 1); if (isE(m)) return m;
      return m.filter(Boolean).length;
    },
    AVERAGEIFS(ctx, t, ...pairs) {
      const bad = needRange(t, 'AVERAGEIFS', 1); if (bad) return bad;
      const m = ifsMask(ctx, 'AVERAGEIFS', pairs, t.v.length, 2); if (isE(m)) return m;
      const l = t.v.filter((v, i) => m[i] && typeof v === 'number');
      return l.length ? l.reduce((x, y) => x + y, 0) / l.length : ERR.div();
    },
    MAXIFS(ctx, t, ...pairs) {
      const bad = needRange(t, 'MAXIFS', 1); if (bad) return bad;
      const m = ifsMask(ctx, 'MAXIFS', pairs, t.v.length, 2); if (isE(m)) return m;
      const l = t.v.filter((v, i) => m[i] && typeof v === 'number');
      return l.length ? Math.max(...l) : 0;
    },
    MINIFS(ctx, t, ...pairs) {
      const bad = needRange(t, 'MINIFS', 1); if (bad) return bad;
      const m = ifsMask(ctx, 'MINIFS', pairs, t.v.length, 2); if (isE(m)) return m;
      const l = t.v.filter((v, i) => m[i] && typeof v === 'number');
      return l.length ? Math.min(...l) : 0;
    },
    SUMPRODUCT(ctx, ...a) {
      const ms = a.map(toVecM);
      const n = ms[0].v.length;
      if (ms.some((m) => m.v.length !== n)) return ERR.value('SUMPRODUCT: todas las matrices deben tener el mismo tamaño.');
      let s = 0;
      for (let i = 0; i < n; i++) {
        let p = 1;
        for (const m of ms) { const v = m.v[i]; if (isE(v)) return v; p *= typeof v === 'number' ? v : 0; }
        s += p;
      }
      if (ms.length === 1 && ms[0].v.some((v) => typeof v === 'boolean')) ctx.warn = 'Ojo: SUMPRODUCT trata TRUE/FALSE como 0. Conviértelos con -- o multiplicando por 1.';
      return s;
    },

    XLOOKUP(ctx, lv, la, ra, nf, mm, sm) {
      if (!isM(la)) return ERR.value('XLOOKUP: el segundo argumento debe ser una columna.');
      if (ra === undefined || ra === null) return ERR.value('XLOOKUP: falta la columna a devolver.');
      const ram = toVecM(ra);
      const mode = mm === undefined || mm === null ? 0 : num(mm);
      const rev = sm !== undefined && sm !== null && num(sm) === -1;
      const one = (v) => {
        const i = lookupIndex(v, la.v, mode, rev);
        if (i < 0) return nf === undefined || nf === null ? ERR.na('XLOOKUP no encontró "' + str(v) + '".') : nf;
        if (ram.c > 1 && la.c === 1) return ram.r === la.r ? new M(1, ram.c, ram.rowAt(i)) : ERR.value();
        return ram.v[i];
      };
      if (isM(lv)) return new M(lv.r, lv.c, lv.v.map((v) => scalarize(one(v))));
      return one(lv);
    },
    VLOOKUP(ctx, lv, tb, ci, approx) {
      if (!isM(tb)) return ERR.value('VLOOKUP: el segundo argumento debe ser la tabla completa.');
      const c = num(ci); if (isE(c)) return c;
      if (c < 1 || c > tb.c) return ERR.ref('VLOOKUP: la tabla solo tiene ' + tb.c + ' columnas y pediste la ' + c + '.');
      const exact = approx !== undefined && approx !== null && !truthy(approx);
      const first = tb.colAt(0);
      const one = (v) => {
        let i = lookupIndex(v, first, exact ? 2 : -1, false);
        if (!exact) { const ex = lookupIndex(v, first, 0, false); if (ex >= 0) i = ex; }
        return i < 0 ? ERR.na('VLOOKUP no encontró "' + str(v) + '".') : tb.get(i, c - 1);
      };
      return isM(lv) ? new M(lv.r, lv.c, lv.v.map(one)) : one(lv);
    },
    INDEX(ctx, arr, r, c) {
      const m = toVecM(arr);
      const one = (rv, cv) => {
        let ri = num(rv === undefined ? 0 : rv), ci2 = num(cv === undefined ? 0 : cv);
        if (isE(ri)) return ri; if (isE(ci2)) return ci2;
        if (m.c === 1 && cv === undefined) ci2 = 1;
        if (m.r === 1 && cv === undefined && rv !== undefined) { ci2 = ri; ri = 1; }
        if (ri > m.r || ci2 > m.c || ri < 0 || ci2 < 0) return ERR.ref('INDEX: pediste una posición fuera del rango.');
        if (ri === 0) return new M(m.r, 1, m.colAt(ci2 - 1));
        if (ci2 === 0) return new M(1, m.c, m.rowAt(ri - 1));
        return m.get(ri - 1, ci2 - 1);
      };
      if (isM(r)) return new M(r.r, r.c, r.v.map((x) => scalarize(one(x, c))));
      return one(r, c);
    },
    MATCH(ctx, lv, la, t) {
      if (!isM(la)) return ERR.value('MATCH: el segundo argumento debe ser una columna.');
      const type = t === undefined || t === null ? 1 : num(t);
      const one = (v) => {
        let i;
        if (type === 0) i = lookupIndex(v, la.v, typeof v === 'string' ? 2 : 0, false);
        else i = lookupIndex(v, la.v, type === 1 ? -1 : 1, false);
        return i < 0 ? ERR.na('MATCH no encontró "' + str(v) + '". ¿Pusiste 0 como tercer argumento?') : i + 1;
      };
      return isM(lv) ? new M(lv.r, lv.c, lv.v.map(one)) : one(lv);
    },
    XMATCH(ctx, lv, la, mm, sm) {
      if (!isM(la)) return ERR.value();
      const mode = mm === undefined || mm === null ? 0 : num(mm);
      const rev = sm !== undefined && num(sm) === -1;
      const one = (v) => { const i = lookupIndex(v, la.v, mode, rev); return i < 0 ? ERR.na() : i + 1; };
      return isM(lv) ? new M(lv.r, lv.c, lv.v.map(one)) : one(lv);
    },

    TRIM: S((t) => str(t).replace(/ +/g, ' ').replace(/^ | $/g, '')),
    CLEAN: S((t) => str(t).replace(/[\x00-\x1F]/g, '')),
    UPPER: S((t) => str(t).toUpperCase()),
    LOWER: S((t) => str(t).toLowerCase()),
    PROPER: S((t) => str(t).toLowerCase().replace(/(^|[^a-záéíóúñü])([a-záéíóúñü])/g, (m, a, b) => a + b.toUpperCase())),
    LEFT: S((t, n) => { const k = n === undefined ? 1 : num(n); return isE(k) ? k : k < 0 ? ERR.value() : str(t).slice(0, k); }),
    RIGHT: S((t, n) => { const k = n === undefined ? 1 : num(n); if (isE(k)) return k; const s = str(t); return k <= 0 ? '' : s.slice(-k); }),
    MID: S((t, st, n) => { const a = num(st), b = num(n); if (isE(a)) return a; if (isE(b)) return b; if (a < 1) return ERR.value(); return str(t).substr(a - 1, b); }),
    LEN: S((t) => str(t).length),
    FIND: S((f, t, st) => { const s0 = st === undefined ? 1 : num(st); const i = str(t).indexOf(str(f), s0 - 1); return i < 0 ? ERR.value('FIND no encontró "' + str(f) + '" (ojo: FIND distingue mayúsculas).') : i + 1; }),
    SEARCH: S((f, t, st) => {
      const s0 = st === undefined ? 1 : num(st); const s = str(t);
      const re = new RegExp(wildRe(str(f)).source.slice(1, -1), 'i');
      const sub = s.slice(s0 - 1); const m = sub.match(re);
      return m ? m.index + s0 : ERR.value('SEARCH no encontró "' + str(f) + '".');
    }),
    SUBSTITUTE: S((t, o, n, inst) => {
      const s = str(t), old = str(o), nu = str(n);
      if (old === '') return s;
      if (inst === undefined) return s.split(old).join(nu);
      let k = num(inst), idx = -1;
      for (let c = 0; c < k; c++) { idx = s.indexOf(old, idx + 1); if (idx < 0) return s; }
      return s.slice(0, idx) + nu + s.slice(idx + old.length);
    }),
    CONCAT: (...a) => { let s = ''; for (const x of a) for (const v of vec(x)) { if (isE(v)) return v; s += str(v); } return s; },
    CONCATENATE: (...a) => lift(a, (...v) => v.map(str).join('')),
    TEXTJOIN: (d, ig, ...a) => {
      const ign = truthy(ig); const parts = [];
      for (const x of a) for (const v of vec(x)) { if (isE(v)) return v; const s = str(v); if (ign && s === '') continue; parts.push(s); }
      return parts.join(str(d));
    },
    TEXTSPLIT: (t, cd, rd) => {
      if (isM(t)) return ERR.value('TEXTSPLIT: usa un solo texto (por ejemplo con INDEX).');
      const s = str(t);
      const rows = rd === undefined || rd === null ? [s] : s.split(str(rd));
      const grid = rows.map((r) => (cd === undefined || cd === null ? [r] : r.split(str(cd))));
      const c = Math.max(...grid.map((g) => g.length));
      return new M(grid.length, c, grid.flatMap((g) => [...g, ...Array(c - g.length).fill(ERR.na())]));
    },
    VALUE: S((t) => {
      if (typeof t === 'number') return t;
      const s = str(t).trim();
      const cleaned = /^-?[\d,]+(\.\d+)?%?$/.test(s) ? s.replace(/,/g, '') : s;
      if (cleaned.endsWith('%') && !isNaN(Number(cleaned.slice(0, -1)))) return Number(cleaned.slice(0, -1)) / 100;
      return cleaned !== '' && !isNaN(Number(cleaned)) ? Number(cleaned) : ERR.value('VALUE no puede convertir "' + str(t) + '" en número.');
    }),
    TEXT: S((v, f) => textFmt(v, f)),

    TODAY: () => { const d = new Date(); return toSerial(d.getFullYear(), d.getMonth() + 1, d.getDate()); },
    DATE: S((y, m, d) => { const a = num(y), b = num(m), c = num(d); if ([a, b, c].some(isE)) return [a, b, c].find(isE); return Math.round((Date.UTC(a, b - 1, c) - EPOCH) / 86400000); }),
    YEAR: S((d) => { const n = num(d); return isE(n) ? n : fromSerial(n).getUTCFullYear(); }),
    MONTH: S((d) => { const n = num(d); return isE(n) ? n : fromSerial(n).getUTCMonth() + 1; }),
    DAY: S((d) => { const n = num(d); return isE(n) ? n : fromSerial(n).getUTCDate(); }),
    EOMONTH: S((d, m) => { const n = num(d), k = num(m); if (isE(n)) return n; if (isE(k)) return k; const x = fromSerial(n); return Math.round((Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + k + 1, 0) - EPOCH) / 86400000); }),
    EDATE: S((d, m) => { const n = num(d), k = num(m); if (isE(n)) return n; if (isE(k)) return k; const x = fromSerial(n); const tgt = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + k, 1)); const last = new Date(Date.UTC(tgt.getUTCFullYear(), tgt.getUTCMonth() + 1, 0)).getUTCDate(); return Math.round((Date.UTC(tgt.getUTCFullYear(), tgt.getUTCMonth(), Math.min(x.getUTCDate(), last)) - EPOCH) / 86400000); }),
    DAYS: S((e, s) => { const a = num(e), b = num(s); if (isE(a)) return a; if (isE(b)) return b; return Math.floor(a) - Math.floor(b); }),
    DATEDIF: S((s, e, u) => {
      const a = num(s), b = num(e); if (isE(a)) return a; if (isE(b)) return b;
      if (a > b) return ERR.num('DATEDIF: la fecha inicial debe ser menor que la final.');
      const x = fromSerial(a), y = fromSerial(b);
      let months = (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + (y.getUTCMonth() - x.getUTCMonth());
      if (y.getUTCDate() < x.getUTCDate()) months--;
      const unit = str(u).toLowerCase();
      if (unit === 'y') return Math.floor(months / 12);
      if (unit === 'm') return months;
      if (unit === 'd') return Math.floor(b) - Math.floor(a);
      if (unit === 'ym') return months % 12;
      return ERR.num('DATEDIF: la unidad debe ser "y", "m", "d" o "ym".');
    }),
    WEEKDAY: S((d, t) => { const n = num(d); if (isE(n)) return n; const w = fromSerial(n).getUTCDay(); const tp = t === undefined ? 1 : num(t); if (tp === 2) return w === 0 ? 7 : w; if (tp === 3) return w === 0 ? 6 : w - 1; return w + 1; }),
    NETWORKDAYS: (s, e, h) => {
      const a = num(scalarize(s)), b = num(scalarize(e)); if (isE(a)) return a; if (isE(b)) return b;
      const hol = new Set(h === undefined ? [] : vec(h).map((v) => Math.floor(num(v))));
      const lo = Math.min(a, b), hi = Math.max(a, b); let n = 0;
      for (let d = Math.floor(lo); d <= Math.floor(hi); d++) { const w = fromSerial(d).getUTCDay(); if (w !== 0 && w !== 6 && !hol.has(d)) n++; }
      return a <= b ? n : -n;
    },

    FILTER(ctx, arr, inc, ifEmpty) {
      const m = toVecM(arr), c = toVecM(inc);
      let keep;
      if (c.v.length === m.r) { keep = c.v.map((v) => { const t = truthy(v); return isE(t) ? false : t; }); ctx.mask = keep; }
      else if (c.v.length === m.c && m.r !== m.c) {
        const cols = c.v.map((v) => truthy(v) === true);
        const out = []; for (let i = 0; i < m.r; i++) for (let j = 0; j < m.c; j++) if (cols[j]) out.push(m.get(i, j));
        const nc = cols.filter(Boolean).length;
        return nc ? new M(m.r, nc, out) : (ifEmpty === undefined ? ERR.calc('FILTER no encontró nada. Usa el 3er argumento para un mensaje.') : ifEmpty);
      } else return ERR.value('FILTER: la condición debe tener el mismo número de filas que la matriz.');
      const rows = []; keep.forEach((k, i) => { if (k) rows.push(...m.rowAt(i)); });
      if (!rows.length) return ifEmpty === undefined ? ERR.calc('FILTER no encontró nada. Usa el 3er argumento para un mensaje, ej. "Sin datos".') : ifEmpty;
      return new M(rows.length / m.c, m.c, rows);
    },
    UNIQUE(ctx, arr, byCol, once) {
      const m = toVecM(arr);
      const keyOf = (i) => m.rowAt(i).map((v) => typeRank(v) + ':' + str(v).toLowerCase()).join('\u0001');
      const counts = new Map(), order = [];
      for (let i = 0; i < m.r; i++) { const k = keyOf(i); if (!counts.has(k)) { counts.set(k, 0); order.push(i); } counts.set(k, counts.get(k) + 1); }
      const ex = once !== undefined && truthy(once) === true;
      const rows = order.filter((i) => !ex || counts.get(keyOf(i)) === 1);
      return new M(rows.length, m.c, rows.flatMap((i) => m.rowAt(i)));
    },
    SORT(ctx, arr, idx, ord) {
      const m = toVecM(arr);
      const k = idx === undefined || idx === null ? 1 : num(idx);
      const o = ord === undefined || ord === null ? 1 : num(ord);
      const rows = sortRows(m, [{ key: (i) => m.get(i, k - 1), ord: o }]);
      return new M(m.r, m.c, rows.flatMap((i) => m.rowAt(i)));
    },
    SORTBY(ctx, arr, ...by) {
      const m = toVecM(arr); const keys = [];
      for (let k = 0; k < by.length; k += 2) {
        const b = toVecM(by[k]); if (b.v.length !== m.r) return ERR.value('SORTBY: la columna para ordenar debe tener las mismas filas.');
        const o = by[k + 1] === undefined ? 1 : num(by[k + 1]);
        keys.push({ key: (i) => b.v[i], ord: o });
      }
      const rows = sortRows(m, keys);
      return new M(m.r, m.c, rows.flatMap((i) => m.rowAt(i)));
    },
    SEQUENCE: (r, c, st, stp) => {
      const R = num(r), C = c === undefined ? 1 : num(c), s0 = st === undefined ? 1 : num(st), d = stp === undefined ? 1 : num(stp);
      const v = []; for (let i = 0; i < R * C; i++) v.push(s0 + i * d);
      return new M(R, C, v);
    },
    ROWS: (a) => (isM(a) ? a.r : 1),
    COLUMNS: (a) => (isM(a) ? a.c : 1),
    TAKE: (a, r, c) => {
      const m = toVecM(a);
      let rows = [...Array(m.r).keys()], cols = [...Array(m.c).keys()];
      if (r !== undefined && r !== null) { const k = num(r); rows = k >= 0 ? rows.slice(0, k) : rows.slice(k); }
      if (c !== undefined && c !== null) { const k = num(c); cols = k >= 0 ? cols.slice(0, k) : cols.slice(k); }
      return new M(rows.length, cols.length, rows.flatMap((i) => cols.map((j) => m.get(i, j))));
    },
    CHOOSECOLS: (a, ...cs) => {
      const m = toVecM(a); const idx = cs.flatMap((x) => vec(x)).map((x) => num(x));
      if (idx.some((x) => x < 1 || x > m.c)) return ERR.value('CHOOSECOLS: la tabla tiene ' + m.c + ' columnas.');
      return new M(m.r, idx.length, [...Array(m.r).keys()].flatMap((i) => idx.map((j) => m.get(i, j - 1))));
    },
    TRANSPOSE: (a) => { const m = toVecM(a); const v = []; for (let j = 0; j < m.c; j++) for (let i = 0; i < m.r; i++) v.push(m.get(i, j)); return new M(m.c, m.r, v); },

    'RANK.EQ': (n, ref, ord) => {
      const vals = vec(ref).filter((v) => typeof v === 'number');
      const desc = ord === undefined || num(ord) === 0;
      return lift([n], (x) => { const v = num(x); if (isE(v)) return v; if (!vals.some((y) => Math.abs(y - v) < 1e-12)) return ERR.na('RANK: el número no está en la lista.'); return 1 + vals.filter((y) => (desc ? y > v + 1e-12 : y < v - 1e-12)).length; });
    },
    LARGE: (a, k) => { const l = flat([a]); if (isE(l)) return l; const s = l.slice().sort((x, y) => y - x); return lift([k], (kk) => { const i = num(kk); return i < 1 || i > s.length ? ERR.num('LARGE: k fuera de rango.') : s[i - 1]; }); },
    SMALL: (a, k) => { const l = flat([a]); if (isE(l)) return l; const s = l.slice().sort((x, y) => x - y); return lift([k], (kk) => { const i = num(kk); return i < 1 || i > s.length ? ERR.num('SMALL: k fuera de rango.') : s[i - 1]; }); },
    'PERCENTILE.INC': (a, k) => { const l = flat([a]); if (isE(l)) return l; const x = num(k); if (isE(x)) return x; if (x < 0 || x > 1) return ERR.num('PERCENTILE: k va entre 0 y 1 (0.9 = percentil 90).'); return percentileInc(l, x); },
    'QUARTILE.INC': (a, q) => { const l = flat([a]); if (isE(l)) return l; const x = num(q); return percentileInc(l, x / 4); },
    'STDEV.S': (...a) => { const l = flat(a); return isE(l) ? l : stdev(l, true); },
    'STDEV.P': (...a) => { const l = flat(a); return isE(l) ? l : stdev(l, false); },
    'VAR.S': (...a) => { const l = flat(a); if (isE(l)) return l; const s = stdev(l, true); return isE(s) ? s : s * s; },
    CORREL: (a, b) => {
      const x = vec(a), y = vec(b);
      if (x.length !== y.length) return ERR.na('CORREL: las dos columnas deben tener el mismo tamaño.');
      const px = [], py = [];
      x.forEach((v, i) => { if (typeof v === 'number' && typeof y[i] === 'number') { px.push(v); py.push(y[i]); } });
      const n = px.length; const mx = px.reduce((s, v) => s + v, 0) / n, my = py.reduce((s, v) => s + v, 0) / n;
      let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (px[i] - mx) * (py[i] - my); sxx += (px[i] - mx) ** 2; syy += (py[i] - my) ** 2; }
      return sxx && syy ? sxy / Math.sqrt(sxx * syy) : ERR.div();
    },
  };
  function ifsLift(fn, critStart) {
    return (ctx, ...a) => {
      const idx = [];
      for (let k = critStart; k < a.length; k += 2) if (isM(a[k]) && a[k].v.length > 1) idx.push(k);
      if (!idx.length) return fn(ctx, ...a);
      const shape = a[idx[0]];
      const out = shape.v.map((_, i) => { const b = a.slice(); idx.forEach((k) => { b[k] = a[k].v[i]; }); return fn(ctx, ...b); });
      ctx.mask = null;
      return new M(shape.r, shape.c, out);
    };
  }
  F.SUMIFS = ifsLift(F.SUMIFS, 2);
  F.AVERAGEIFS = ifsLift(F.AVERAGEIFS, 2);
  F.MAXIFS = ifsLift(F.MAXIFS, 2);
  F.MINIFS = ifsLift(F.MINIFS, 2);
  F.COUNTIFS = ifsLift(F.COUNTIFS, 1);
  F.SUMIF = ifsLift(F.SUMIF, 1);
  F.AVERAGEIF = ifsLift(F.AVERAGEIF, 1);
  F.RANK = F['RANK.EQ'];
  F.PERCENTILE = F['PERCENTILE.INC'];
  F.STDEV = F['STDEV.S'];
  const ERR_OK = new Set(['IFERROR', 'IFNA', 'ISERROR', 'ISNA', 'ISNUMBER', 'ISTEXT', 'ISBLANK', 'IF', 'IFS']);
  const CTX_FNS = new Set(['SUMIF', 'COUNTIF', 'AVERAGEIF', 'SUMIFS', 'COUNTIFS', 'AVERAGEIFS', 'MAXIFS', 'MINIFS', 'SUMPRODUCT', 'XLOOKUP', 'VLOOKUP', 'INDEX', 'MATCH', 'XMATCH', 'FILTER', 'UNIQUE', 'SORT', 'SORTBY']);

  function evalNode(n, ctx, scope) {
    switch (n.k) {
      case 'num': case 'str': case 'bool': return n.v;
      case 'miss': return undefined;
      case 'arr': return n.m;
      case 'neg': return lift([evalNode(n.e, ctx, scope)], (v) => { const x = num(v); return isE(x) ? x : -x; });
      case 'bin': return binop(n.op, evalNode(n.l, ctx, scope), evalNode(n.r, ctx, scope));
      case 'name': {
        const key = n.v.toLowerCase();
        for (let s = scope; s; s = s.parent) if (s.vars.has(key)) return s.vars.get(key);
        const tb = ctx.tables[key];
        if (tb) { ctx.tablesUsed.add(tb.name); return new M(tb.rows.length, tb.columns.length, tb.rows.flat()); }
        return ERR.name('Excel no conoce el nombre ' + n.v + '. Si es un texto, va entre comillas: "' + n.v + '". Si es una columna: tblVentas[' + n.v + '].');
      }
      case 'ref': {
        const tb = ctx.tables[n.table.toLowerCase()];
        if (!tb) {
          const names = Object.values(ctx.tables).map((t) => t.name).join(', ');
          return ERR.name('No existe la tabla "' + n.table + '". Tablas disponibles: ' + names + '.');
        }
        const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
        const j = tb.columns.findIndex((c) => norm(c) === norm(n.col));
        if (j < 0) return ERR.name('La tabla ' + tb.name + ' no tiene la columna "' + n.col + '". Columnas: ' + tb.columns.join(', ') + '.');
        ctx.tablesUsed.add(tb.name);
        ctx.refs.add(tb.name + '[' + tb.columns[j] + ']');
        return new M(tb.rows.length, 1, tb.rows.map((r) => r[j]));
      }
      case 'fn': {
        ctx.fns.add(n.name);
        if (n.name === 'LET') {
          if (n.args.length < 3 || n.args.length % 2 === 0) return ERR.value('LET: (nombre, valor, ..., cálculo).');
          const sc = { vars: new Map(), parent: scope };
          for (let k = 0; k < n.args.length - 1; k += 2) {
            const nm = n.args[k];
            if (nm.k !== 'name') return ERR.value('LET: el argumento ' + (k + 1) + ' debe ser un nombre (sin comillas).');
            sc.vars.set(nm.v.toLowerCase(), evalNode(n.args[k + 1], ctx, sc));
          }
          return evalNode(n.args[n.args.length - 1], ctx, sc);
        }
        const f = F[n.name];
        if (!f) {
          const known = ES[n.raw.toUpperCase()] ? '' : ' Revisa cómo está escrita.';
          return ERR.name('Excel no conoce la función "' + n.raw.toUpperCase() + '".' + known);
        }
        const args = n.args.map((a) => evalNode(a, ctx, scope));
        if (!ERR_OK.has(n.name)) { const e = args.find(isE); if (e) return e; }
        return CTX_FNS.has(n.name) ? f(ctx, ...args) : f(...args);
      }
    }
    return ERR.value();
  }

  function evaluate(formula, tables) {
    const ctx = { tables: {}, fns: new Set(), refs: new Set(), tablesUsed: new Set(), mask: null, warn: null };
    for (const t of tables) ctx.tables[t.name.toLowerCase()] = t;
    const src = String(formula || '').trim();
    if (!src) return { ok: false, error: { code: '', msg: 'Escribe una fórmula.' }, ctx };
    if (!src.startsWith('=')) return { ok: false, error: { code: '', msg: 'Toda fórmula en Excel empieza con =.' }, ctx };
    try {
      const { ast } = parse(src);
      ctx.isLiteral = ast.k === 'num' || ast.k === 'str' || ast.k === 'bool';
      const v = scalarize(evalNode(ast, ctx, null));
      if (isE(v)) return { ok: false, error: v, ctx };
      return { ok: true, value: v, ctx };
    } catch (e) {
      return { ok: false, error: { code: e.code || '#ERROR', msg: e.message }, ctx };
    }
  }

  function sigAt(text, caret) {
    // Busca la función abierta más interna antes del cursor
    const s = text.slice(0, caret);
    let depth = 0, inStr = false;
    for (let i = s.length - 1; i >= 0; i--) {
      const c = s[i];
      if (c === '"') inStr = !inStr;
      if (inStr) continue;
      if (c === ')') depth++;
      if (c === '(') {
        if (depth === 0) {
          const m = s.slice(0, i).match(/([A-Za-zÁÉÍÓÚÑáéíóúñ_][A-Za-z0-9ÁÉÍÓÚÑáéíóúñ_.]*)$/);
          if (!m) return null;
          let argIdx = 0, d2 = 0, q = false;
          for (let k = i + 1; k < s.length; k++) {
            const ch = s[k];
            if (ch === '"') q = !q;
            if (q) continue;
            if (ch === '(' || ch === '{') d2++;
            else if (ch === ')' || ch === '}') d2--;
            else if ((ch === ',' || ch === ';') && d2 === 0) argIdx++;
          }
          const name = canon(m[1]);
          return SIG[name] ? { name, sig: SIG[name], arg: argIdx } : null;
        }
        depth--;
      }
    }
    return null;
  }

  function display(v) {
    if (isM(v)) return v;
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') return fmtNum(v);
    return String(v);
  }

  function same(a, b, tol = 1e-6) {
    a = scalarize(a); b = scalarize(b);
    if (isM(a) || isM(b)) {
      if (!isM(a) || !isM(b) || a.r !== b.r || a.c !== b.c) return false;
      return a.v.every((x, i) => same(x, b.v[i], tol));
    }
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
    if (isE(a) || isE(b)) return isE(a) && isE(b) && a.code === b.code;
    return a === b;
  }

  window.XL = { evaluate, sigAt, display, same, toSerial, fromSerial, isM, isE, M, SIG, fmtNum, textFmt };
})();
