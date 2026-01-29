import { io } from 'socket.io-client'
import CodeMirror from 'codemirror'

import "../css/homePage.css"
import "codemirror/lib/codemirror.css"


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


let editor
const modal = document.getElementById('log-modal')
async function createLogPop(id, actionType) {
    
    // show the modal
    const modalTitle = document.getElementById('modal-title')

    modalTitle.textContent = `${actionType} #${id} logs`
    modal.style.display = 'flex'
    document.body.style.overflow = "hidden"

    // create the editor
    const viewer = document.getElementById('log-viewer')
    if (!editor) {
        editor = CodeMirror(viewer, {
            value: "Loading...",
            readOnly: true,
            mode: "text/plain",
            viewportMargin: Infinity,
            lineNumbers: true
        })
    } else {
        editor.setValue("Loading....")
    }
    editor.refresh()

    let logs = await fetchLog(id)
    if (logs == "NULL") {
      logs = "No logs available."
    }

    editor.setValue(logs)
    editor.refresh()
}

document.getElementById("close-modal").addEventListener("click", () => {
    if (editor) {
        editor.setValue('')
        editor.refresh()
    }
    modal.style.display = "none"
    document.body.style.overflow = "auto"
});

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none"
        document.body.style.overflow = "auto"
    }
});


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
    const actionType = row[4]
    const btn = createLogButton(id, actionType)
    tr.appendChild(btn)

    return tr
}


function createLogButton(id, actionType) {
    let btn = document.createElement("BUTTON")
    btn.id = id
    btn.classList.add('logs-button')
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32" fill="none" stroke="currentColor" stroke-width="4">
        <line x1="8" y1="8" x2="8" y2="56" stroke-linecap="round"/>
         <line x1="8" y1="56" x2="56" y2="56" stroke-linecap="round"/>
        <line x1="20" y1="44" x2="56" y2="8" stroke-linecap="round"/>
        <polyline points="44,8 56,8 56,20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`

    btn.addEventListener("click", () => {
        createLogPop(id, actionType)
    })

    return btn
}


async function fetchLog(id) {
    let log = "NULL"
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