// --- 1. CONFIGURACIÓN INICIAL ---
const margin = {top: 20, right: 30, bottom: 50, left: 60},
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// --- 2. CREAR LIENZO SVG ---
const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// --- 3. CARGAR DATOS Y DIBUJAR GRÁFICO ---
d3.csv("data.csv").then(function(data) {

    // Convertir población a número
    data.forEach(d => {
        d.population = +d.population;
    });

    // --- ESCALAS ---
    const x = d3.scaleBand()
      .range([ 0, width ])
      .domain(data.map(d => d.year))
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.population)])
      .range([ height, 0]);

    // --- EJES ---
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .style("text-anchor", "end");
    
    svg.append("g")
      .call(d3.axisLeft(y));

    // Añadir etiqueta al eje Y
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "end")
        .attr("y", -margin.left + 20)
        .attr("x", -height/2 + 50)
        .attr("transform", "rotate(-90)")
        .text("Población estimada de linces");


    // --- BARRAS (inicialmente invisibles) ---
    const bars = svg.selectAll("mybar")
      .data(data)
      .enter()
      .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.year))
        .attr("width", x.bandwidth())
        .attr("y", d => y(0)) // Empiezan en 0
        .attr("height", 0);   // Con altura 0


    // --- 4. CONFIGURACIÓN DE SCROLLAMA ---
    const scroller = scrollama();

    function handleStepEnter(response) {
        // response.index es el índice del paso actual (0, 1, 2...)
        const stepIndex = response.index;
        const stepElement = response.element;
        
        // Resaltar el paso de texto actual
        d3.selectAll('.step').classed('is-active', (d, i) => i === stepIndex);

        // Actualizar el gráfico basado en el paso
        updateChart(stepIndex);
    }

    function updateChart(index) {
        let visibleYears = [];
        if (index === 0) { // Paso 1
            visibleYears = ['2002'];
        } else if (index === 1) { // Paso 2
            visibleYears = ['2002', '2008', '2015'];
        } else if (index === 2) { // Paso 3
            visibleYears = ['2002', '2008', '2015', '2020'];
        } else if (index === 3) { // Paso 4
            visibleYears = ['2002', '2008', '2015', '2020', '2024'];
        }

        bars
          .transition().duration(500)
          .attr("y", d => visibleYears.includes(d.year) ? y(d.population) : y(0))
          .attr("height", d => visibleYears.includes(d.year) ? height - y(d.population) : 0)
          .attr("class", d => d.year === '2024' && visibleYears.includes('2024') ? "bar highlight" : "bar");
    }

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