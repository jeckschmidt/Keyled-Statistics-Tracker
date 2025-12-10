const socket = io();
var isRendered

socket.on('init', (data) => {
    console.log('Connected:', data);
    const {columns, rows} = data
    renderTable(columns, rows)
});

socket.on('newRow', (data) => {
    console.log('Received new row: ', data);
    var row = data.newRow

    console.log(row)
    
    appendRow(row)
});


function renderTable(columns, rows) {

    if (isRendered) {
        return
    }

    // HEADERS
    const thead = document.getElementById('table_head')

    // Create a <tr>
    const tr = document.createElement('tr');
    tr.classList.add('table100-head');

    // Loop through columns and create <th> for each
    columns.forEach(column => {
        const th = document.createElement('th');
        th.classList.add('table100-head');
        th.textContent = column; // sets the text inside <th>
        tr.appendChild(th);
    });
    // Append <tr> to <thead>
    thead.appendChild(tr)

    // ROWS OF DATA
    const tbody = document.getElementById('table_body')
    rows.forEach(row => {
        const tr = document.createElement('tr');

        row.forEach((data, colIndex) => {
            const td = document.createElement('td');

            if (colIndex === 4) {
                // Create a <span> with conditional class
                const span = document.createElement('span');
                if (data === 'pass') span.classList.add('num-green');
                else if (data === 'fail') span.classList.add('num-red');

                span.textContent = data;
                td.appendChild(span);
            } else {
                td.textContent = data;
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    })
    isRendered = true
}

function appendRow(row) {

    const tbody = document.getElementById('table_body')
    const tr = document.createElement('tr');

    row.forEach((data, colIndex) => {
        const td = document.createElement('td');

        if (colIndex === 4) {
            // Create a <span> with conditional class
            const span = document.createElement('span');
            if (data === 'pass') span.classList.add('num-green');
            else if (data === 'fail') span.classList.add('num-red');

            span.textContent = data;
            td.appendChild(span);
        } else {
            td.textContent = data;
        }

        tr.appendChild(td);
    });
    tbody.appendChild(tr);
}