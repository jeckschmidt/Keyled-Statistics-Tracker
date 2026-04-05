import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { generateApiKey } from 'generate-api-key'

/*--------------------------------API KEY------------------------------------*/
/*---------------------------------------------------------------------------*/
/* Generate api key */
export async function genSecret() {
    // generate the key
    const key = generateApiKey({method: 'uuidv4'})

    // hash the key
    const hashed_key = hashKeyData(key)

    // return the key and hashed key
    return [key, hashed_key]
}

export function compareHash(key, hashedKey) {
    const newKeyHash = hashKeyData(key)
    return newKeyHash === hashedKey
}

function hashKeyData(key) {
    return crypto.createHash('sha256').update(key).digest('hex')
}
/*---------------------------------------------------------------------------*/



/*---------------------------------PASSWORD----------------------------------*/
/*---------------------------------------------------------------------------*/
/* Generate hashed password */
export async function hashPassword(password) {
    // hash the password
    const salt = await bcrypt.genSalt(12)
    const hash = await bcrypt.hash(password, salt)

    // return
    return hash
}


export async function isPasswordValid(password, hash) {
    return await bcrypt.compare(password, hash)
}

let sessions = new Map()

function genSessionId() {
    return crypto.randomBytes(32).toString("hex")
}

export function createSession(username) {
    const sessionId = genSessionId()

    sessions.set(sessionId, {
        username,
        createdAt: Date.now()
    })

    return sessionId
}

export function getSessionId(sessionId) {
    return sessions.get(sessionId)
}
/*---------------------------------------------------------------------------*/

