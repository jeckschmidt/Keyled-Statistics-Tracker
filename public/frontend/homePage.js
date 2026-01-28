import { io } from 'socket.io-client'

/* ----------------------WEBSOCKETS----------------------------*/
/* ----------------------------------------------------------- */
const socket = io();
let isRendered

socket.on('init', (data) => {
    if (data.success == false) {
        console.error("Server couldn't send table")
        return
    }
    const {columns, rows, statusColumnIndex} = data.table
    renderTable(columns, rows, statusColumnIndex)
});

socket.on('newRow', (data) => {
    if (data.success = false) {
        console.error("Server couldn't send row")
        return
    }
    const row = data.newRow
    const statusColumnIndex = data.statusColumnIndex
    appendRow(row, statusColumnIndex)
});
/* ----------------------------------------------------------- */



/* ----------------------TABLE RENDERING-----------------------*/
/* ----------------------------------------------------------- */
function renderTable(columns, rows, statusColumnIndex) {

    if (isRendered) {
        return
    }
    rows.reverse()

    // HEADERS
    const thead = document.getElementById('table_head')

    // Create a <tr>, a row for the columns names
    const tr = document.createElement('tr')
    tr.classList.add('table100-head');

    // Loop through columns and create <th> for each, the individual column names
    columns.forEach(column => {
        const th = document.createElement('th')
        th.classList.add('table100-head')
        th.textContent = column; // sets the text inside <th>
        tr.appendChild(th)
    });

    // Create extra "logs" column
    const th = document.createElement('th')
    th.classList.add('table100-head')
    th.textContent = 'Logs'
    tr.appendChild(th)

    // Append <tr> to <thead>; appending the row to the table head
    thead.appendChild(tr)

    // ROWS OF DATA
    const tbody = document.getElementById('table_body')
    rows.forEach(row => {
        const tr = createTableRow(row, statusColumnIndex)
        tbody.appendChild(tr);
    })
    isRendered = true
}

function appendRow(row, statusColumnIndex) {

    const tbody = document.getElementById('table_body')
    const tr = createTableRow(row, statusColumnIndex)

    //tbody.append(tr) **** this is for descending order
    tbody.prepend(tr);
}
/* ----------------------------------------------------------- */



/* ----------------------LOG VIEWER--------------------------- */
/* ----------------------------------------------------------- */


/* ----------------------------------------------------------- */



/* -------------------HELPER FUNCTIONS------------------------ */
/* ----------------------------------------------------------- */

function createTableRow(row, statusColumnIndex) {
    const tr = document.createElement('tr');

    row.forEach((data, colIndex) => {
        const td = document.createElement('td');

        if (colIndex === statusColumnIndex) {
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
    })

    // Create "Logs" button
    const id = row[0]
    const btn = createLogButton(id)
    tr.appendChild(btn)

    return tr
}


function createLogButton(id) {
    let btn = document.createElement("BUTTON")
    btn.id = id
    btn.innerText = 'Button'
    btn.classList.add('button-logs')

    // do something on click
    btn.addEventListener("click", async function(event) {
        const log = await fetchLog(id)

        if (log === null || log == "NULL") {
            console.log(`No log available for entry ${id}`)
            return
        }
        console.log(`log #${id}: ${log}`)
    })
    return btn
}


async function fetchLog(id) {
    let log = null
    try {
        const response = await fetch(`/database/get-log/${id}`)
        if (response.status != 200) {
            console.log(`Couldn't retreive log: ${response}`)
            return log
        }
        const data = await response.json()
        log = data.logs
        return log
    } catch (err) {
        console.error(err)
        return log
    }      
}
/* ----------------------------------------------------------- */