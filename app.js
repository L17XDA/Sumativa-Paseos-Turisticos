let experiencias = []; 
let reservas = []; 
let precioMaximo = 0;
let textoBusqueda = ""; 
let categoriaActual = "todas"; 
let ordenActual = "normal"; 
 
const catalogo = document.querySelector("#catalogo"); 
const buscador = document.querySelector("#buscador"); 
const filtroCategoria = document.querySelector("#filtroCategoria"); 
const ordenPrecio = document.querySelector("#ordenPrecio"); 
const listaReservas = document.querySelector("#listaReservas"); 
const total = document.querySelector("#total"); 
const estado = document.querySelector("#estado"); 
 
async function cargarExperiencias() { 
  try { 
    estado.textContent = "Cargando experiencias..."; 
    const respuesta = await fetch("./data/experiencias.json"); 
    if (!respuesta.ok) throw new Error("No fue posible cargar las experiencias"); 
    experiencias = await respuesta.json(); 
    estado.textContent = `${experiencias.length} experiencias disponibles`; 
    actualizarCatalogo(); 
  } catch (error) { 
    estado.textContent = "Error al cargar la información"; 
    console.error(error); 
  } 
} 
 
function obtenerResultados() { 
  let resultados = [...experiencias]; 
  
  if (categoriaActual !== "todas") { 
    resultados = resultados.filter(e => e.categoria === categoriaActual); 
  } 
  
  if (textoBusqueda !== "") { 
    resultados = resultados.filter(e => 
      e.nombre.toLowerCase().includes(textoBusqueda)); 
  } 

  if (precioMaximo !== null && !isNaN(precioMaximo) && precioMaximo > 0) {
    resultados = resultados.filter(e => e.precio <= precioMaximo);
  }
  
  if (ordenActual === "ascendente") resultados.sort((a,b) => a.precio-b.precio); 
  if (ordenActual === "descendente") resultados.sort((a,b) => b.precio-a.precio); 
  
  return resultados; 
}
 
function actualizarCatalogo() { 
  const resultados = obtenerResultados(); 
  if (resultados.length === 0) { 
    catalogo.innerHTML = `<p class="sin-resultados">No se encontraron experiencias</p>`; 
    estado.textContent = "0 resultados"; 
    return; 
  } 
  catalogo.innerHTML = resultados.map(e => ` 
    <article class="tarjeta"> 
      <div class="imagen">${e.icono}</div> 
      <div class="informacion"> 
        <span class="categoria">${e.categoria}</span> 
        <h3>${e.nombre}</h3> 
        <p>Cupo disponible: ${e.cupo}</p> 
        <p class="precio">$${e.precio} MXN</p> 
        <label>Personas: 
          <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1"> 
        </label> 
        <button class="btn-reservar" data-id="${e.id}">Agregar</button> 
      </div> 
    </article>`).join(""); 
  estado.textContent = `${resultados.length} resultados`; 
  agregarEventosReservar(); 
}
 
function agregarEventosReservar() { 
  document.querySelectorAll(".btn-reservar").forEach(boton => { 
    boton.addEventListener("click", () => agregarReserva(Number(boton.dataset.id))); 
  }); 
} 
 
function agregarReserva(id) { 
  const experiencia = experiencias.find(e => e.id === id); 
  const cantidadInput = document.querySelector(`#cantidad-${id}`);
  const cantidad = Number(cantidadInput ? cantidadInput.value : 1); 

  if (cantidad < 1 || cantidad > experiencia.cupo) { 
    alert("Cantidad no válida o supera el cupo disponible"); 
    return; 
  } 

  const existente = reservas.find(r => r.experienciaId === id); 

  if (existente) { 
    const nuevaCantidad = existente.cantidad + cantidad; 
    if (nuevaCantidad > experiencia.cupo) { 
      alert("La cantidad total supera el cupo disponible"); 
      return; 
    } 
    existente.cantidad = nuevaCantidad; 
    existente.subtotal = nuevaCantidad * experiencia.precio; 
  } else { 
    reservas.push({ 
      experienciaId: id, 
      nombre: experiencia.nombre, 
      precio: experiencia.precio, 
      cupoMaximo: experiencia.cupo,
      cantidad: cantidad, 
      subtotal: experiencia.precio * cantidad 
    }); 
  } 

  mostrarReservas(); 
}
 
function mostrarReservas() { 
  if (reservas.length === 0) { 
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>"; 
    total.textContent = "$0 MXN"; 
    return; 
  } 

  listaReservas.innerHTML = reservas.map(r => ` 
    <article class="item-reserva"> 
      <div>
        <strong>${r.nombre}</strong> 
        <p>$${r.precio} MXN c/u</p>
        <label>Personas:
          <input 
            type="number" 
            class="input-editar-reserva" 
            data-id="${r.experienciaId}" 
            min="1" 
            max="${r.cupoMaximo}" 
            value="${r.cantidad}"
          >
        </label>
      </div> 
      <div>
        <strong>$${r.subtotal} MXN</strong> 
        <button class="btn-eliminar" data-id="${r.experienciaId}">Eliminar</button>
      </div> 
    </article>`).join(""); 

  const totalReserva = reservas.reduce((suma, r) => suma + r.subtotal, 0); 
  total.textContent = `$${totalReserva} MXN`; 

  agregarEventosEliminar(); 
  agregarEventosEditarCantidad();
}

function agregarEventosEditarCantidad() {
  document.querySelectorAll(".input-editar-reserva").forEach(input => {
    input.addEventListener("change", (e) => {
      const id = Number(e.target.dataset.id);
      const nuevaCantidad = Number(e.target.value);
      actualizarCantidadReserva(id, nuevaCantidad);
    });
  });
}

function actualizarCantidadReserva(id, nuevaCantidad) {
  const reserva = reservas.find(r => r.experienciaId === id);
  if (!reserva) return;

  if (nuevaCantidad < 1) {
    eliminarReserva(id);
    return;
  }

  if (nuevaCantidad > reserva.cupoMaximo) {
    alert(`La cantidad no puede superar el cupo máximo de ${reserva.cupoMaximo} personas.`);
    mostrarReservas(); 
    return;
  }

  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = nuevaCantidad * reserva.precio;
  mostrarReservas();
}
 
function agregarEventosEliminar() { 
  document.querySelectorAll(".btn-eliminar").forEach(boton => { 
    boton.addEventListener("click", () => eliminarReserva(Number(boton.dataset.id))); 
  }); 
} 
 
function eliminarReserva(id) { 
  const reserva = reservas.find(r => r.experienciaId === id);
  const confirmar = confirm(`¿Estás seguro de que deseas eliminar "${reserva?.nombre || 'esta experiencia'}" de tu reservación?`);
  
  if (confirmar) {
    reservas = reservas.filter(r => r.experienciaId !== id); 
    mostrarReservas(); 
  }
}
 
buscador.addEventListener("input", () => { 
  textoBusqueda = buscador.value.trim().toLowerCase(); actualizarCatalogo(); 
}); 
filtroCategoria.addEventListener("change", () => { 
  categoriaActual = filtroCategoria.value; actualizarCatalogo(); 
}); 
ordenPrecio.addEventListener("change", () => { 
  ordenActual = ordenPrecio.value; actualizarCatalogo(); 
}); 

const filtroPrecio = document.querySelector("#filtroPrecio"); 

filtroPrecio.addEventListener("input", () => {
  const valor = parseFloat(filtroPrecio.value);
  precioMaximo = isNaN(valor) ? null : valor;
  actualizarCatalogo();
});

cargarExperiencias();