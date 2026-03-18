/* ═══════════════════════════════════════
   ALMACÉN · SPA Application Logic
   ═══════════════════════════════════════ */

const CATALOGS = {
  conceptos: {
    title: "Conceptos",
    endpoint: "/api/conceptos",
    columns: [
      { key: "id",          label: "ID" },
      { key: "clave",       label: "Clave" },
      { key: "descripcion", label: "Descripción" },
      { key: "tipo",        label: "Tipo" },
    ],
    fields: [
      { name: "clave",       label: "Clave",       type: "text",   required: true, placeholder: "Ej: COMP-001" },
      { name: "descripcion", label: "Descripción", type: "text",   required: true, placeholder: "Descripción del concepto" },
      {
        name: "tipo", label: "Tipo", type: "select", required: true,
        options: [
          { value: "ambos",   label: "Ambos" },
          { value: "ingreso", label: "Ingreso" },
          { value: "egreso",  label: "Egreso" },
        ],
      },
    ],
  },
  destinos: {
    title: "Destinos",
    endpoint: "/api/destinos",
    columns: [
      { key: "id",           label: "ID" },
      { key: "clave",        label: "Clave" },
      { key: "nombre",       label: "Nombre" },
      { key: "responsable",  label: "Responsable" },
    ],
    fields: [
      { name: "clave",       label: "Clave",        type: "text", required: true,  placeholder: "Ej: DEST-01" },
      { name: "nombre",      label: "Nombre",       type: "text", required: true,  placeholder: "Nombre del destino" },
      { name: "responsable", label: "Responsable",  type: "text", required: false, placeholder: "Nombre del responsable" },
    ],
  },
  productos: {
    title: "Productos",
    endpoint: "/api/productos",
    columns: [
      { key: "id",            label: "ID" },
      { key: "clave",         label: "Clave" },
      { key: "descripcion",   label: "Descripción" },
      { key: "stock_minimo",  label: "Stock Mín." },
    ],
    fields: [
      { name: "clave",        label: "Clave",         type: "text",   required: true,  placeholder: "Ej: PROD-001" },
      { name: "descripcion",  label: "Descripción",   type: "text",   required: true,  placeholder: "Nombre del producto" },
      { name: "unidad_id",    label: "ID Unidad Med.", type: "number", required: false, placeholder: "ID de unidad" },
      { name: "stock_minimo", label: "Stock Mínimo",  type: "number", required: false, placeholder: "0" },
    ],
  },
  unidades: {
    title: "Unidades de Medida",
    endpoint: "/api/unidades-medida",
    columns: [
      { key: "id",           label: "ID" },
      { key: "clave",        label: "Clave" },
      { key: "descripcion",  label: "Descripción" },
      { key: "abreviatura",  label: "Abreviatura" },
    ],
    fields: [
      { name: "clave",        label: "Clave",        type: "text", required: true, placeholder: "Ej: UM-001" },
      { name: "descripcion",  label: "Descripción",  type: "text", required: true, placeholder: "Ej: Kilogramo" },
      { name: "abreviatura",  label: "Abreviatura",  type: "text", required: true, placeholder: "Ej: kg" },
    ],
  },
};

const App = (() => {
  let currentView   = "home";
  let currentCatalog = null;
  let editingId      = null;
  let allRows        = [];

  // ── DOM Refs ─────────────────────────────────────────────────────────────
  const viewHome    = document.getElementById("view-home");
  const viewCatalog = document.getElementById("view-catalog");
  const viewComing  = document.getElementById("view-coming");
  const tableHead   = document.getElementById("table-head");
  const tableBody   = document.getElementById("table-body");
  const emptyMsg    = document.getElementById("empty-msg");
  const modalOverlay= document.getElementById("modal-overlay");
  const modalTitle  = document.getElementById("modal-title");
  const formFields  = document.getElementById("form-fields");
  const topbarTitle = document.getElementById("topbar-title");
  const btnNuevo    = document.getElementById("btn-nuevo");
  const toastEl     = document.getElementById("toast");
  const dbStatus    = document.getElementById("db-status");

  // ── Navigation ────────────────────────────────────────────────────────────
  function navigate(view) {
    currentView = view;

    // Update nav highlights
    document.querySelectorAll(".nav-item").forEach(a => {
      a.classList.toggle("active", a.dataset.view === view);
    });

    // Determine which panel to show
    if (view === "home") {
      showView(viewHome);
      topbarTitle.textContent = "Dashboard";
      btnNuevo.style.display  = "none";
    } else if (CATALOGS[view]) {
      currentCatalog = CATALOGS[view];
      showView(viewCatalog);
      topbarTitle.textContent = currentCatalog.title.toUpperCase();
      btnNuevo.style.display  = "inline-flex";
      loadTable();
    } else {
      showView(viewComing);
      topbarTitle.textContent = view.toUpperCase();
      btnNuevo.style.display  = "none";
    }
  }

  function showView(el) {
    [viewHome, viewCatalog, viewComing].forEach(v => v.classList.remove("active"));
    el.classList.add("active");
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  async function loadTable() {
    if (!currentCatalog) return;
    try {
      const res = await fetch(currentCatalog.endpoint);
      allRows = await res.json();
      renderTable(allRows);
    } catch {
      toast("Error al conectar con el servidor", "err");
    }
  }

  function renderTable(rows) {
    // Header
    const cols = currentCatalog.columns;
    tableHead.innerHTML = `<tr>${cols.map(c => `<th>${c.label}</th>`).join("")}<th>Acciones</th></tr>`;

    // Body
    if (!rows.length) {
      tableBody.innerHTML = "";
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";
    tableBody.innerHTML = rows.map(row => `
      <tr>
        ${cols.map(c => `<td>${row[c.key] ?? "—"}</td>`).join("")}
        <td>
          <div class="row-actions">
            <button class="btn btn--edit" onclick="App.openModal(${row.id})">Editar</button>
            <button class="btn btn--danger" onclick="App.deleteRow(${row.id})">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function filterTable() {
    const q = document.getElementById("search-input").value.toLowerCase();
    const filtered = allRows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    );
    renderTable(filtered);
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  async function openModal(id = null) {
    if (!currentCatalog) return;
    editingId = id;
    modalTitle.textContent = id ? `Editar ${currentCatalog.title}` : `Nuevo ${currentCatalog.title}`;
    buildFormFields();

    if (id) {
      try {
        const res = await fetch(`${currentCatalog.endpoint}/${id}`);
        const data = await res.json();
        currentCatalog.fields.forEach(f => {
          const el = document.querySelector(`[name="${f.name}"]`);
          if (el) el.value = data[f.name] ?? "";
        });
      } catch {
        toast("Error cargando registro", "err");
      }
    }

    modalOverlay.classList.add("open");
  }

  function buildFormFields() {
    formFields.innerHTML = currentCatalog.fields.map(f => {
      if (f.type === "select") {
        const opts = f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("");
        return `
          <div class="form-group">
            <label for="f_${f.name}">${f.label}</label>
            <select name="${f.name}" id="f_${f.name}" ${f.required ? "required" : ""}>${opts}</select>
          </div>`;
      }
      return `
        <div class="form-group">
          <label for="f_${f.name}">${f.label}</label>
          <input type="${f.type}" name="${f.name}" id="f_${f.name}"
                 placeholder="${f.placeholder || ""}"
                 ${f.required ? "required" : ""}/>
        </div>`;
    }).join("");
  }

  function closeModal(e) {
    if (e && e.target !== modalOverlay) return;
    modalOverlay.classList.remove("open");
    editingId = null;
  }

  async function submitForm(e) {
    e.preventDefault();
    const body = {};
    currentCatalog.fields.forEach(f => {
      const el = document.querySelector(`[name="${f.name}"]`);
      body[f.name] = el ? el.value : null;
    });

    const url    = editingId ? `${currentCatalog.endpoint}/${editingId}` : currentCatalog.endpoint;
    const method = editingId ? "PUT" : "POST";

    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      toast(data.message, "ok");
      modalOverlay.classList.remove("open");
      loadTable();
    } catch (err) {
      toast(err.message, "err");
    }
  }

  async function deleteRow(id) {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      const res  = await fetch(`${currentCatalog.endpoint}/${id}`, { method: "DELETE" });
      const data = await res.json();
      toast(data.message, "ok");
      loadTable();
    } catch {
      toast("Error al eliminar", "err");
    }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  let toastTimer;
  function toast(msg, type = "ok") {
    toastEl.textContent = msg;
    toastEl.className   = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3000);
  }

  // ── DB Health ─────────────────────────────────────────────────────────────
  async function checkHealth() {
    try {
      const res  = await fetch("/api/health");
      const data = await res.json();
      if (data.status === "ok") {
        dbStatus.textContent = "● BD conectada";
        dbStatus.className   = "db-status ok";
      } else throw new Error();
    } catch {
      dbStatus.textContent = "● BD desconectada";
      dbStatus.className   = "db-status err";
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Nav click handlers
    document.querySelectorAll(".nav-item").forEach(a => {
      a.addEventListener("click", e => {
        e.preventDefault();
        if (a.classList.contains("nav-item--coming")) return;
        navigate(a.dataset.view);
        // Close sidebar on mobile
        document.getElementById("sidebar").classList.remove("open");
      });
    });

    // Hamburger
    document.getElementById("hamburger").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });

    checkHealth();
    setInterval(checkHealth, 30000);
  }

  init();

  return { navigate, openModal, closeModal, submitForm, deleteRow, filterTable };
})();
