// VARIABLES DE ESTADO
let movimientosActuales = [];
let tipoDocumentoActual = "";

// --- NAVEGACIÓN ---
function navegar(id) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.getElementById('vista-' + id).classList.add('activa');
}

// --- LÓGICA DE CATÁLOGOS ---
function abrirCatalogo(nombre) {
    document.getElementById('titulo-catalogo').innerText = "Catálogo de " + nombre;
    document.getElementById('formCatalogo').reset();
    navegar('catalogos');
}

document.getElementById('formCatalogo').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("Datos de catálogo listos para enviarse a la base de datos.");
    navegar('inicio');
});

// --- LÓGICA DE DOCUMENTOS ---
function abrirDocumento(tipo) {
    tipoDocumentoActual = tipo;
    movimientosActuales = [];
    document.getElementById('titulo-doc').innerText = "Documento de " + tipo;
    document.getElementById('doc-tipo').value = tipo;
    document.getElementById('lbl-entidad').innerText = (tipo === 'Entrada') ? "Proveedor" : "Destino";
    
    // Limpiar tabla y totales
    actualizarTabla();
    navegar('documentos');
}

// Cálculo automático en Modal
const inPre = document.getElementById('m-precio');
const inCan = document.getElementById('m-cant');
const inSub = document.getElementById('m-sub');

[inPre, inCan].forEach(input => {
    input.addEventListener('input', () => {
        const res = (parseFloat(inPre.value) || 0) * (parseFloat(inCan.value) || 0);
        inSub.value = res.toFixed(2);
    });
});

function agregarMovimiento() {
    const p = document.getElementById('m-prod').value;
    const pre = parseFloat(inPre.value) || 0;
    const can = parseFloat(inCan.value) || 0;

    if(p && can > 0) {
        movimientosActuales.push({ 
            no: movimientosActuales.length + 1, 
            producto: p, 
            precio: pre, 
            cantidad: can, 
            subtotal: pre * can 
        });
        actualizarTabla();
        bootstrap.Modal.getInstance(document.getElementById('modalProd')).hide();
        // Limpiar modal
        document.getElementById('m-prod').value = ""; inPre.value = ""; inCan.value = ""; inSub.value = "";
    }
}

function actualizarTabla() {
    const cuerpo = document.getElementById('tabla-movimientos');
    cuerpo.innerHTML = "";
    let total = 0;

    movimientosActuales.forEach(m => {
        total += m.subtotal;
        cuerpo.innerHTML += `<tr>
            <td>${m.no}</td><td>${m.producto}</td><td>${m.cantidad}</td>
            <td>$${m.precio.toFixed(2)}</td><td>$${m.subtotal.toFixed(2)}</td>
        </tr>`;
    });
    document.getElementById('doc-total').innerText = `$${total.toFixed(2)}`;
}

// 
function guardarDocumentoCompleto() {
    // Este objeto es el que se enviará por POST a la Base de Datos
    const dataFinal = {
        numero: document.getElementById('doc-numero').value,
        fecha: document.getElementById('doc-fecha').value,
        tipo: tipoDocumentoActual,
        entidad: document.getElementById('doc-entidad').value,
        concepto: document.getElementById('doc-concepto').value,
        items: movimientosActuales
    };

    console.log("Objeto preparado para la BD:", dataFinal);
    alert("Frontend Completo.");
}
