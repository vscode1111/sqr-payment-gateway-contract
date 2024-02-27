import { arrayify } from '@ethersproject/bytes';
import { AbiCoder, Signer, keccak256, solidityPacked, toUtf8Bytes } from 'ethers';
import { MerkleTree } from 'merkletreejs';

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
