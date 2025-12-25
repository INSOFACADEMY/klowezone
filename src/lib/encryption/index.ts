import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16

// Get master key from environment
function getMasterKey(): Buffer {
  const masterKey = process.env.MASTER_KEY
  if (!masterKey) {
    throw new Error('MASTER_KEY environment variable is required')
  }

  // If it's a hex string, convert it
  if (masterKey.length === 64) {
    return Buffer.from(masterKey, 'hex')
  }

  // If it's a base64 string
  if (masterKey.length === 44) {
    return Buffer.from(masterKey, 'base64')
  }

  // Otherwise, hash it to get a consistent key
  return crypto.scryptSync(masterKey, 'salt', KEY_LENGTH)
}

export interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
}

export class EncryptionService {
  private static instance: EncryptionService
  private masterKey: Buffer

  private constructor() {
    this.masterKey = getMasterKey()
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data: string): EncryptedData {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipherGCM(ALGORITHM, this.masterKey, iv)

    cipher.setAAD(Buffer.from('')) // Additional Authenticated Data

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedData): string {
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const tag = Buffer.from(encryptedData.tag, 'hex')
    const decipher = crypto.createDecipherGCM(ALGORITHM, this.masterKey, iv)

    decipher.setAuthTag(tag)
    decipher.setAAD(Buffer.from(''))

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Encrypt object as JSON string
   */
  encryptObject(obj: any): EncryptedData {
    return this.encrypt(JSON.stringify(obj))
  }

  /**
   * Decrypt and parse JSON object
   */
  decryptObject<T = any>(encryptedData: EncryptedData): T {
    const decrypted = this.decrypt(encryptedData)
    return JSON.parse(decrypted)
  }
}

// Convenience functions
export const encrypt = (data: string): EncryptedData => {
  return EncryptionService.getInstance().encrypt(data)
}

export const decrypt = (encryptedData: EncryptedData): string => {
  return EncryptionService.getInstance().decrypt(encryptedData)
}

export const encryptObject = (obj: any): EncryptedData => {
  return EncryptionService.getInstance().encryptObject(obj)
}

export const decryptObject = <T = any>(encryptedData: EncryptedData): T => {
  return EncryptionService.getInstance().decryptObject<T>(encryptedData)
}

// Utility to generate a new master key
export const generateMasterKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

// Validate master key format
export const validateMasterKey = (key: string): boolean => {
  try {
    // Try to create cipher with the key
    const testData = 'test'
    const cipher = crypto.createCipher(ALGORITHM, Buffer.from(key, 'hex'))
    cipher.update(testData, 'utf8')
    cipher.final()
    return true
  } catch {
    return false
  }
}



