// --- 1. CONFIGURACIÓN INICIAL ---
const margin = { top: 50, right: 30, bottom: 50, left: 60 },
  width = 600 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// --- 2. CREAR LIENZO SVG ---
// Se usa viewBox en lugar de width/height fijos para que el gráfico
// escale de forma fluida con el ancho de su contenedor (responsive).
const svg = d3
  .select("#chart")
  .append("svg")
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`,
  )
  .attr("preserveAspectRatio", "xMidYMid meet")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// --- 3. CARGAR DATOS Y DIBUJAR GRÁFICO ---
d3.csv("data.csv").then(function (data) {
  console.log("Datos cargados:", data); // Debug

  // Convertir a número y calcular el total (España + Portugal)
  data.forEach((d) => {
    d.spain = +d.spain;
    d.portugal = +d.portugal;
    d.total = d.spain + d.portugal;
  });

  console.log("Datos procesados:", data); // Debug

  // Apilamos las dos series (España abajo, Portugal arriba) para
  // poder dibujar barras compuestas que muestren la contribución de
  // cada país al total.
  const series = d3.stack().keys(["spain", "portugal"])(data);
  const spainSeries = series[0];
  const portugalSeries = series[1];

  // --- ESCALAS ---
  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(data.map((d) => d.year))
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.total) * 1.08])
    .range([height, 0]);

  // --- EJES ---
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text");

  svg.append("g").call(d3.axisLeft(y));

  // Añadir etiqueta al eje Y
  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left) // Posición original sin separación adicional
    .attr("x", 0 - height / 2)
    .attr("dy", "0.65em") // mueve el texto un poco más allá de la línea del eje
    .style("text-anchor", "middle")
    .text("Población estimada de linces");

  // --- LEYENDA (España / Portugal) ---
  // A la derecha del eje Y, dentro del área del gráfico,
  // cerca de la esquina superior izquierda del área de barras.
  const legend = svg
    .append("g")
    .attr("class", "chart-legend")
    .attr("transform", `translate(8, 8)`);

  legend
    .append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("class", "bar");
  legend.append("text").attr("x", 18).attr("y", 10).text("España");

  legend
    .append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("y", 18)
    .attr("class", "bar-portugal");
  legend.append("text").attr("x", 18).attr("y", 28).text("Portugal");

  // --- BARRAS (inicialmente invisibles) ---
  // Segmento inferior: España
  const spainBars = svg
    .selectAll(".bar-spain")
    .data(spainSeries)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.data.year))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(0)) // Empiezan en 0
    .attr("height", 0); // Con altura 0

  // Segmento superior: Portugal (se apila sobre el de España)
  const portugalBars = svg
    .selectAll(".bar-portugal-rect")
    .data(portugalSeries)
    .enter()
    .append("rect")
    .attr("class", "bar-portugal")
    .attr("x", (d) => x(d.data.year))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(0))
    .attr("height", 0);

  // Añadir etiqueta a las barras (con el total combinado)
  const labels = svg
    .selectAll(".bar-label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    // Posición X: en el centro de la barra
    .attr("x", (d) => x(d.year) + x.bandwidth() / 2)
    // Posición Y: un poco por encima de la barra
    .attr("y", (d) => y(d.total) - 5)
    // El texto que se mostrará es el total (España + Portugal)
    .text((d) => d.total)
    // Opacidad inicial en 0 para que aparezcan con la animación
    .style("opacity", 0);

  // --- 4. CONFIGURACIÓN DE SCROLLAMA ---
  const scroller = scrollama();

  function handleStepEnter(response) {
    // response.index es el índice del paso actual (0, 1, 2...)
    const stepIndex = response.index;

    // Resaltar el paso de texto actual
    d3.selectAll(".step").classed("is-active", (d, i) => i === stepIndex);

    // Actualizar el gráfico basado en el paso
    updateChart(stepIndex);
  }

  function updateChart(index) {
    let visibleYears = [];
    if (index === 0) {
      // Paso 1
      visibleYears = ["2002"];
    } else if (index === 1) {
      // Paso 2
      visibleYears = ["2002", "2008", "2015"];
    } else if (index === 2) {
      // Paso 3
      visibleYears = ["2002", "2008", "2015", "2020"];
    } else if (index === 3) {
      // Paso 4
      visibleYears = [
        "2002",
        "2008",
        "2015",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
      ];
    } else if (index === 4) {
      // Paso 5
      visibleYears = [
        "2002",
        "2008",
        "2015",
        "2020",
        "2021",
        "2022",
        "2023",
        "2024",
        "2025",
      ];
    }

    // El año más reciente revelado se resalta en verde sobre el mapa de barras
    const highlightYear = visibleYears.at(-1);

    spainBars
      .transition()
      .duration(500)
      .attr("y", (d) => (visibleYears.includes(d.data.year) ? y(d[1]) : y(0)))
      .attr("height", (d) =>
        visibleYears.includes(d.data.year) ? y(d[0]) - y(d[1]) : 0,
      )
      .attr("class", (d) =>
        d.data.year === highlightYear && visibleYears.includes(d.data.year)
          ? "bar highlight"
          : "bar",
      );

    portugalBars
      .transition()
      .duration(500)
      .attr("y", (d) => (visibleYears.includes(d.data.year) ? y(d[1]) : y(0)))
      .attr("height", (d) =>
        visibleYears.includes(d.data.year) ? y(d[0]) - y(d[1]) : 0,
      );

    // Actualizar la opacidad de las ETIQUETAS para que coincida con las barras
    labels
      .transition()
      .duration(500)
      .style("opacity", (d) => (visibleYears.includes(d.year) ? 1 : 0));
  }

  // Configurar Scrollama
  scroller
    .setup({
      step: ".scroll-text .step",
      offset: 0.6, // Se activa cuando el paso supera el 60% de la pantalla
      debug: false, // Ponlo en true para ver las líneas de activación
    })
    .onStepEnter(handleStepEnter);

  // Disparar la primera actualización manualmente
  updateChart(-1);
});
