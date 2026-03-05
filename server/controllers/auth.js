import crypto from 'crypto'
import { generateApiKey } from 'generate-api-key'

/* Generate api key */
export async function genKey() {
    // generate the key
    const key = generateApiKey({method: 'uuidv4'})

    // hash the key
    const hashed_key = hashData(key)

    // return the key and hashed key
    return [key, hashed_key]
}


export function compareHash(key, hashedKey) {
    const newKeyHash = hashData(key)
    return newKeyHash === hashedKey
}

function hashData(key) {
    return crypto.createHash('sha256').update(key).digest('hex')
}