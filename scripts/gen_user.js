// required modules
import readline from 'readline/promises'
import { stdin as input, stdout as output } from "process";

// custom modules
import { hashPassword } from './server/controllers/auth.js';
import { insertIntoUsers } from './server/controllers/database.js';

// function for generating key
async function genNewLogin() {

    // get creds
    const rl = readline.createInterface({input, output})
    const username = await rl.question("Username: ")
    const password = await rl.question("Password: ")
    console.log('')
    rl.close()

    // create a secure key
    const password_hash = await hashPassword(password)

    // save it into database
    try {
        await insertIntoUsers(username, password_hash)
        console.log('[successfully created new login]')
    } catch (err) {
        console.error("Could't generate new login:", err)
        return
    }

    console.log(`username: ${username}`)
    console.log(`password: ${password}`)
    input.destroy()
}

// run function
genNewLogin()