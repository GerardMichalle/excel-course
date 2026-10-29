window.COURSE = window.COURSE || { blocks: [] };
(function () {
  const D = (d, m, y) => window.XL.toSerial(y, m, d);
  const ventas = [
    ['P001', 'Arroz 5kg', 22.5, 8, 'Abarrotes', D(3, 9, 2026), 'Carlos'],
    ['P002', 'Aceite 5kg', 9.8, 12, 'Abarrotes', D(5, 9, 2026), 'Ana'],
    ['P003', 'Azucar 1kg', 4.2, 20, 'Abarrotes', D(12, 9, 2026), 'Carlos'],
    ['P004', 'Leche evaporada', 4.5, 24, 'Bebidas', D(18, 9, 2026), 'Ana'],
    ['P005', 'Fideos', 3.1, 15, 'Abarrotes', D(2, 10, 2026), 'Luis'],
    ['P006', 'Atun en lata', 6.5, 10, 'Abarrotes', D(7, 10, 2026), 'Ana'],
    ['P007', 'Gaseosa 1.5L', 7, 18, 'Bebidas', D(15, 10, 2026), 'Luis'],
    ['P008', 'Detergente', 5.8, 9, 'Limpieza', D(21, 10, 2026), 'Carlos'],
    ['P009', 'Galletas', 1.5, 30, 'Abarrotes', D(25, 10, 2026), 'Luis'],
  ].map(([cod, des, pu, cant, cat, fecha, vend]) => [
    cod, des, pu, cant, Math.round(pu * cant * 100) / 100, cat, cant < 10 ? 'Reponer' : 'OK', fecha, vend,
  ]);

  window.COURSE.tables = {
    tblVentas: {
      name: 'tblVentas',
      sheet: 'Ventas',
      columns: ['Cod', 'Descripcion', 'PrecioUnit', 'Cantidad', 'Total', 'Categoria', 'Estado', 'Fecha', 'Vendedor'],
      dateCols: ['Fecha'],
      rows: ventas,
    },
    tblVendedores: {
      name: 'tblVendedores',
      sheet: 'Vendedores',
      columns: ['Vendedor', 'Zona', 'Meta', 'Comision'],
      pctCols: ['Comision'],
      rows: [
        ['Carlos', 'Norte', 300, 0.05],
        ['Ana', 'Centro', 320, 0.06],
        ['Luis', 'Sur', 250, 0.04],
        ['Marta', 'Norte', 280, 0.05],
      ],
    },
    tblBonos: {
      name: 'tblBonos',
      sheet: 'Bonos',
      columns: ['Desde', 'Bono'],
      pctCols: ['Bono'],
      rows: [[0, 0], [200, 0.02], [300, 0.04]],
    },
    tblClientes: {
      name: 'tblClientes',
      sheet: 'Clientes',
      columns: ['ID', 'Cliente', 'Ciudad', 'Email', 'Telefono', 'Registro', 'UltimaCompra'],
      dateCols: ['Registro', 'UltimaCompra'],
      rows: [
        ['C01', '  juan PEREZ  ', 'trujillo', 'juan.perez@gmail.com', '949-123-456', D(15, 1, 2025), D(20, 10, 2026)],
        ['C02', 'MARIA lopez', '  Lima', 'maria_lopez@hotmail.com', '987 654 321', D(3, 3, 2024), D(2, 9, 2026)],
        ['C03', 'pedro  ramos', 'TRUJILLO ', 'pramos@empresa.pe', '956-789-012', D(22, 7, 2025), D(28, 10, 2026)],
        ['C04', 'Ana Torres', 'Chiclayo', 'ana.torres@gmail.com', 912345678, D(10, 11, 2023), D(15, 6, 2026)],
        ['C05', '  luis   diaz', 'lima', 'ldiaz@outlook.com', '934-567-890', D(5, 5, 2026), D(27, 10, 2026)],
        ['C06', 'ROSA mendoza ', 'Piura', null, '945 111 222', D(18, 8, 2024), D(1, 3, 2026)],
      ],
    },
  };

  // Texto para pegar en Excel (separado por tabulaciones)
  window.COURSE.toTSV = function (tableName, cols) {
    const t = window.COURSE.tables[tableName];
    const idx = (cols || t.columns).map((c) => t.columns.indexOf(c));
    const fmt = (v, c) => {
      if (v === null) return '';
      if ((t.dateCols || []).includes(c)) {
        const d = window.XL.fromSerial(v);
        return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear();
      }
      return String(v);
    };
    const head = idx.map((i) => t.columns[i]).join('\t');
    const body = t.rows.map((r) => idx.map((i) => fmt(r[i], t.columns[i])).join('\t')).join('\n');
    return head + '\n' + body;
  };
})();
