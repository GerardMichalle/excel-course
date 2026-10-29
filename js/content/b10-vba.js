COURSE.blocks.push({
  id: 'b10',
  title: 'Macros y VBA',
  subtitle: 'Grabadora, editor, bucles y botones',
  level: 'Experto',
  desc: 'Automatizar lo repetitivo: el formato de cada lunes, agregar ventas desde un formulario, refrescar todo y exportar a PDF con un botón. La convocatoria pide VBA; aquí llegas a escribir macros propias.',
  lessons: [
    {
      id: 'b10-grabadora',
      title: 'Grabar tu primera macro',
      fns: ['Record Macro', '.xlsm'],
      tables: ['tblVentas'],
      requireDoit: true,
      why: `<p>Una macro es una lista de instrucciones que Excel repite por ti. La forma más fácil de empezar es <b>grabarla</b>: Excel anota en código VBA todo lo que haces. Después lees ese código y aprendes cómo se escribe.</p>
<p>Ya tienes la pestaña <b>Developer</b> visible (se ve en tu captura). Si alguna vez no aparece: <b>File &gt; Options &gt; Customize Ribbon</b> &gt; marca <b>Developer</b> &gt; OK.</p>`,
      steps: [
        'Selecciona la celda <b>A1</b> de la hoja Resumen.',
        '<b>Developer &gt; Record Macro</b>. Macro name: <code>FormatoReporte</code> (sin espacios). Shortcut: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>. Store macro in: <b>This Workbook</b>. OK.',
        'Haz tus acciones: pon la fila 1 en negrita, color de relleno, ajusta el ancho de columnas (doble clic entre letras de columna).',
        '<b>Developer &gt; Stop Recording</b>.',
        'Deshaz el formato a mano y ejecuta la macro: <b>Developer &gt; Macros</b> &gt; FormatoReporte &gt; <b>Run</b>. O usa el atajo.',
        'Guarda como <b>.xlsm</b>: <b>File &gt; Save As &gt; Excel Macro-Enabled Workbook (*.xlsm)</b>. Un .xlsx borra las macros al guardar.',
        'Referencias relativas: activa <b>Developer &gt; Use Relative References</b> antes de grabar si quieres que la macro actúe desde la celda donde estés, no siempre en A1.',
      ],
      tips: ['Si al abrir sale la barra amarilla "Security Warning", dale <b>Enable Content</b>. La configuración está en <b>Developer &gt; Macro Security</b>.', 'Las macros no se deshacen con Ctrl+Z. Prueba en una copia del archivo.'],
      doit: ['Grabé la macro FormatoReporte', 'La ejecuté desde Developer > Macros > Run', 'Guardé el archivo como .xlsm'],
      exercises: [
        { id: 'b10-g1', type: 'choice', q: 'Guardaste como .xlsx un archivo con macros. ¿Qué pasa?', o: ['Nada', 'Excel elimina las macros', 'Se convierte solo a .xlsm', 'Se corrompe'], a: 1, why: 'Solo .xlsm (o .xlsb) guardan macros.' },
        { id: 'b10-g2', type: 'choice', q: 'Grabaste con referencias absolutas y la macro siempre escribe en A1. Quieres que escriba donde estás:', o: ['Volver a grabar con Use Relative References activado', 'Cambiar el atajo', 'Guardar como .xlsx', 'No se puede'], a: 0, why: 'Relativas = desde la celda activa.' },
      ],
    },
    {
      id: 'b10-editor',
      title: 'El editor VBA: leer y escribir código',
      fns: ['Alt+F11', 'Sub', 'MsgBox', 'Range', 'Dim'],
      tables: ['tblVentas'],
      requireDoit: true,
      why: `<p>El editor de VBA (<kbd>Alt</kbd>+<kbd>F11</kbd>) es donde vive el código. Ahí ves la macro que grabaste y escribes las tuyas. Lo básico:</p>
<p><code>Sub Nombre()</code> ... <code>End Sub</code> es una macro. <code>Range("B2").Value</code> lee o escribe una celda. <code>Dim x As Double</code> crea una variable. <code>MsgBox</code> muestra un mensaje. Con eso ya automatizas mucho.</p>`,
      steps: [
        '<kbd>Alt</kbd>+<kbd>F11</kbd> abre el editor. A la izquierda, <b>Project Explorer</b>: tu libro, sus hojas y <b>Modules</b>.',
        'Doble clic en <b>Module1</b> para ver la macro grabada. Lee las líneas: son tus clics en código.',
        'Nuevo módulo: <b>Insert &gt; Module</b>.',
        'Pega el código de abajo. Pon el cursor dentro del Sub y pulsa <kbd>F5</kbd> para ejecutarlo.',
        '<kbd>F8</kbd> ejecuta línea por línea (depurar). Pasa el mouse sobre una variable para ver su valor.',
        '<b>View &gt; Immediate Window</b> (<kbd>Ctrl</kbd>+<kbd>G</kbd>): con <code>Debug.Print x</code> ves valores sin MsgBox.',
      ],
      code: [
        { title: 'Tu primera macro escrita', vba: `Sub ResumenRapido()
    Dim total As Double
    Dim n As Long

    total = Application.WorksheetFunction.Sum(Range("tblVentas[Total]"))
    n = Range("tblVentas[Cod]").Rows.Count

    MsgBox "Ventas: S/ " & Format(total, "#,##0.00") & vbNewLine & _
           "N° de ventas: " & n, vbInformation, "Don Pepe"
End Sub` },
        { title: 'Escribir en celdas', vba: `Sub EscribirFecha()
    With Worksheets("Resumen")
        .Range("H1").Value = "Actualizado:"
        .Range("I1").Value = Now
        .Range("I1").NumberFormat = "dd/mm/yyyy hh:mm"
    End With
End Sub` },
      ],
      tips: ['<code>Application.WorksheetFunction</code> te deja usar SUM, SUMIFS, XLOOKUP... desde VBA.', 'Escribe <code>Option Explicit</code> al inicio del módulo: VBA te obligará a declarar variables y te avisará de errores de escritura.'],
      doit: ['Abrí el editor y leí mi macro grabada', 'Ejecuté ResumenRapido con F5', 'Probé F8 para ir línea por línea'],
      exercises: [
        { id: 'b10-e1', type: 'value', q: '¿Qué <b>N° de ventas</b> muestra el MsgBox de ResumenRapido?', verify: '=ROWS(tblVentas[Cod])' },
        { id: 'b10-e2', type: 'choice', q: '¿Qué muestra este código?<pre class="vba">Dim t As Double\nt = 22.5 * 8\nMsgBox t</pre>', o: ['22.5', '8', '180', 'Error'], a: 2, why: 'Multiplica y muestra el resultado en t.' },
        { id: 'b10-e3', type: 'choice', q: '<code>Range("B2").Value = "Hola"</code> hace:', o: ['Lee B2', 'Escribe Hola en B2 de la hoja activa', 'Borra B2', 'Busca Hola'], a: 1, why: 'A la izquierda del = se escribe.' },
      ],
    },
    {
      id: 'b10-bucles',
      title: 'Bucles y decisiones: recorrer la tabla',
      fns: ['For Each', 'If', 'ListObjects'],
      tables: ['tblVentas'],
      requireDoit: true,
      why: `<p>El verdadero poder: hacer algo con <b>cada fila</b>. <code>For Each</code> recorre filas; <code>If</code> decide. Con eso marcas alertas, cuentas, copias filas a otra hoja o generas reportes.</p>
<p><code>ListObjects("tblVentas")</code> es tu Tabla de Excel en VBA: no importa cuántas filas tenga, el bucle se adapta.</p>`,
      steps: ['Pega el código en un módulo y ejecútalo con <kbd>F5</kbd>.', 'Cambia una Cantidad a 5 en tblVentas y vuelve a ejecutar: el conteo cambia. Luego regrésala.'],
      code: [
        { title: 'Contar productos a reponer y pintarlos', vba: `Sub RevisarStock()
    Dim tb As ListObject
    Dim fila As ListRow
    Dim conteo As Long

    Set tb = Worksheets("Ventas").ListObjects("tblVentas")

    For Each fila In tb.ListRows
        If fila.Range.Cells(1, tb.ListColumns("Cantidad").Index).Value < 10 Then
            fila.Range.Interior.Color = RGB(255, 230, 230)
            conteo = conteo + 1
        Else
            fila.Range.Interior.ColorIndex = xlNone
        End If
    Next fila

    MsgBox conteo & " producto(s) por reponer", vbExclamation
End Sub` },
        { title: 'For con contador (otra forma)', vba: `Sub NumerarFilas()
    Dim i As Long
    For i = 1 To 10
        Worksheets("Resumen").Cells(i + 1, 10).Value = i
    Next i
End Sub` },
      ],
      tips: ['<code>Cells(fila, columna)</code> usa números: Cells(2, 3) es C2. Ideal dentro de bucles.'],
      doit: ['Ejecuté RevisarStock y vi las filas pintadas', 'Cambié una cantidad, volví a ejecutar y el conteo cambió'],
      exercises: [
        { id: 'b10-b1', type: 'value', q: 'Con los datos originales, ¿qué número muestra el MsgBox de RevisarStock?', verify: '=COUNTIF(tblVentas[Cantidad],"<10")' },
        { id: 'b10-b2', type: 'choice', q: '¿Cuántas veces se ejecuta el interior de <code>For i = 1 To 10</code>?', o: ['9', '10', '11', 'Infinito'], a: 1, why: 'De 1 a 10 inclusive.' },
        { id: 'b10-b3', type: 'choice', q: 'Ventaja de recorrer <code>tb.ListRows</code> en vez de <code>For i = 2 To 10</code>:', o: ['Ninguna', 'Se adapta solo a cuántas filas tenga la tabla', 'Es más corto de escribir', 'Pinta las celdas'], a: 1, why: 'Un rango fijo se rompe cuando llegan más datos.' },
      ],
    },
    {
      id: 'b10-automatizar',
      title: 'Automatización completa: formulario, botón, refresh y PDF',
      fns: ['InputBox', 'ListRows.Add', 'RefreshAll', 'ExportAsFixedFormat'],
      tables: ['tblVentas'],
      requireDoit: true,
      why: `<p>Juntamos todo en lo que una empresa realmente usa: un botón <b>Registrar venta</b> que pide los datos y los agrega a la tabla, y un botón <b>Actualizar reporte</b> que refresca Power Query y las dinámicas y exporta el dashboard a PDF. Esto es lo que la convocatoria llama automatización con VBA (Query).</p>`,
      steps: [
        'Pega las dos macros en un módulo.',
        'En la hoja Dashboard: <b>Developer &gt; Insert &gt; Button (Form Control)</b> (el primer ícono). Dibuja el botón.',
        'Se abre <b>Assign Macro</b>: elige <code>ActualizarReporte</code> &gt; OK. Clic derecho en el botón &gt; <b>Edit Text</b> &gt; "Actualizar reporte".',
        'Otro botón para <code>RegistrarVenta</code> en la hoja Ventas.',
        'Prueba: registra una venta de prueba, actualiza, revisa el PDF en la carpeta del archivo. Luego borra la fila de prueba y vuelve a actualizar.',
      ],
      code: [
        { title: 'Registrar una venta', vba: `Sub RegistrarVenta()
    Dim tb As ListObject, nueva As ListRow
    Dim cod As String, des As String
    Dim precio As Double, cant As Long

    cod = InputBox("Código (ej. P010):", "Nueva venta")
    If cod = "" Then Exit Sub
    des = InputBox("Descripción:", "Nueva venta")
    precio = Val(InputBox("Precio unitario:", "Nueva venta"))
    cant = Val(InputBox("Cantidad:", "Nueva venta"))

    Set tb = Worksheets("Ventas").ListObjects("tblVentas")
    Set nueva = tb.ListRows.Add

    With nueva.Range
        .Cells(1, tb.ListColumns("Cod").Index).Value = cod
        .Cells(1, tb.ListColumns("Descripcion").Index).Value = des
        .Cells(1, tb.ListColumns("PrecioUnit").Index).Value = precio
        .Cells(1, tb.ListColumns("Cantidad").Index).Value = cant
        .Cells(1, tb.ListColumns("Fecha").Index).Value = Date
    End With

    MsgBox "Venta " & cod & " registrada", vbInformation
End Sub` },
        { title: 'Actualizar todo y exportar PDF', vba: `Sub ActualizarReporte()
    Dim ruta As String

    ThisWorkbook.RefreshAll          ' Power Query + tablas dinámicas
    Application.CalculateUntilAsyncQueriesDone

    ruta = ThisWorkbook.Path & "\\Dashboard_" & Format(Date, "yyyy-mm-dd") & ".pdf"
    Worksheets("Dashboard").ExportAsFixedFormat Type:=xlTypePDF, Filename:=ruta

    MsgBox "Reporte actualizado y guardado en:" & vbNewLine & ruta, vbInformation
End Sub` },
      ],
      tips: ['Las columnas Total y Estado se calculan solas porque son fórmulas de la Tabla: la macro solo llena los datos.', 'Para formularios más pro existen los <b>UserForms</b> (Insert &gt; UserForm en el editor). Con InputBox ya cubres lo que piden.'],
      doit: ['Creé el botón Registrar venta y agregué una venta de prueba', 'Creé el botón Actualizar reporte', 'Se generó el PDF del dashboard', 'Borré la venta de prueba'],
      exercises: [
        { id: 'b10-a1', type: 'choice', q: '<code>ThisWorkbook.RefreshAll</code> actualiza:', o: ['Solo fórmulas', 'Consultas de Power Query y tablas dinámicas del libro', 'Solo la hoja activa', 'El formato'], a: 1, why: 'Es el Data > Refresh All desde código.' },
        { id: 'b10-a2', type: 'choice', q: 'El usuario cancela el primer InputBox. ¿Qué evita que se agregue una fila vacía?', o: ['Set tb', 'If cod = "" Then Exit Sub', 'MsgBox', 'Dim cant'], a: 1, why: 'InputBox cancelado devuelve "" y sales de la macro.' },
      ],
    },
  ],
  quiz: [
    { q: 'Atajo para abrir el editor de VBA:', o: ['Ctrl+F11', 'Alt+F11', 'F5', 'Ctrl+Shift+V'], a: 1, why: 'Alt+F11.' },
    { q: 'En el editor, F5 y F8 hacen:', o: ['Guardar / cerrar', 'Ejecutar / ejecutar paso a paso', 'Copiar / pegar', 'Buscar / reemplazar'], a: 1, why: 'F8 es clave para depurar.' },
    { q: 'Formato de archivo que guarda macros:', o: ['.xlsx', '.xlsm', '.csv', '.pdf'], a: 1, why: '.xlsm = macro-enabled.' },
    { q: '<code>Cells(3, 2)</code> es la celda:', o: ['C2', 'B3', 'C3', 'B2'], a: 1, why: 'Cells(fila, columna): fila 3, columna 2 (B).' },
    { q: 'Para usar SUMIFS dentro de VBA:', o: ['No se puede', 'Application.WorksheetFunction.SumIfs(...)', 'SUMIFS() directo', 'Range.SUMIFS'], a: 1, why: 'WorksheetFunction expone las funciones de Excel.' },
    { q: '¿Qué hace <code>Option Explicit</code>?', o: ['Acelera la macro', 'Obliga a declarar variables con Dim', 'Oculta errores', 'Protege el código'], a: 1, why: 'Evita errores por variables mal escritas.' },
    { q: 'Las macros se deshacen con Ctrl+Z:', o: ['Sí', 'No: prueba en una copia del archivo', 'Solo las grabadas', 'Solo en .xlsm'], a: 1, why: 'Una macro borra el historial de deshacer.' },
    { q: 'Para asignar una macro a un botón:', o: ['Developer > Insert > Button (Form Control) > Assign Macro', 'Insert > Shapes', 'Data > Macro', 'View > Button'], a: 0, why: 'También puedes clic derecho en una forma > Assign Macro.' },
  ],
});
