// required modules
import readline from 'readline/promises'
import { stdin as input, stdout as output } from "process";

// custom modules
import { genSecret } from './server/controllers/auth.js';
import { insertIntoSecrets } from './server/controllers/database.js';

// function for generating key
async function genNewKey() {

    // get user for key
    const rl = readline.createInterface({input, output})
    const user = await rl.question("Who's the key for?: ")
    rl.close()

    // create a secure key
    const [key, hashed_key] = await genSecret()

    // save it into database
    try {
        await insertIntoSecrets(user, hashed_key)
    } catch (err) {
        console.error("Could't generate new key:", err)
    }

    console.log(`Key for ${user}: ${key}`)
    input.destroy()
}

// run function
genNewKey()