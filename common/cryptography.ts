import { arrayify } from '@ethersproject/bytes';
import { createCipheriv, createDecipheriv } from 'crypto';
import { AbiCoder, Interface, Signer, keccak256, solidityPacked, toUtf8Bytes } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { sanitizePrivateKey } from './wallet';

export function keccak256FromStr(data: string): string {
  return keccak256(toUtf8Bytes(data));
}

export async function signEncodePackedMessage(
  signer: Signer,
  types: readonly string[],
  values: readonly any[],
): Promise<string> {
  const packed = solidityPacked(types, values);
  const hash = keccak256(packed);
  const messageHashBin = arrayify(hash);
  return signer.signMessage(messageHashBin);
}

export async function signEncodedMessage(
  signer: Signer,
  types: readonly string[],
  values: readonly any[],
): Promise<string> {
  const abiCoder = AbiCoder.defaultAbiCoder();
  const encoded = abiCoder.encode(types, values);
  const hash = keccak256(encoded);
  const messageHashBin = arrayify(hash);
  return signer.signMessage(messageHashBin);
}

export function getFunction(input: string, abiInterface: Interface) {
  return abiInterface.getFunction(input.slice(0, 10));
}

export function decodeInput<T>(input: string, abiInterface: Interface): T {
  return abiInterface.decodeFunctionData(input.slice(0, 10), input) as T;
}

export function decodeData(data: string, types: readonly string[]) {
  return AbiCoder.defaultAbiCoder().decode(types, data);
}

export function getMerkleRootHash(whitelist: string[]) {
  let leaves = whitelist.map((addr) => keccak256(addr));
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return merkleTree.getHexRoot();
}

export function getMerkleProofs(whitelist: string[], account: string) {
  let leaves = whitelist.map((addr) => keccak256(addr));
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  let hashedAddress = keccak256(account);
  return merkleTree.getHexProof(hashedAddress);
}

export function symmetricEncryptByPrivateKey(message: string, privateKey: string) {
  const sanitizedPrivateKey = sanitizePrivateKey(privateKey);
  const key = Buffer.from(sanitizedPrivateKey, 'hex');
  const iv = Buffer.from(sanitizedPrivateKey.substring(0, 32), 'hex');
  const cipher = createCipheriv('aes256', key, iv);
  return cipher.update(message, 'utf8', 'hex') + cipher.final('hex');
}

export function symmetricDecryptByPrivateKey(encryptedMessage: string, privateKey: string) {
  const sanitizedPrivateKey = sanitizePrivateKey(privateKey);
  const key = Buffer.from(sanitizedPrivateKey, 'hex');
  const iv = Buffer.from(sanitizedPrivateKey.substring(0, 32), 'hex');
  const decipher = createDecipheriv('aes256', key, iv);
  return decipher.update(encryptedMessage, 'hex', 'utf-8') + decipher.final('utf8');
}
