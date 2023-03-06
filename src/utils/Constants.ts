import {PublicKey} from '@solana/web3.js';

// eslint-disable-next-line prefer-destructuring
const env = process.env;

export const VRF_PROGRAM_ADDRESS = env.REACT_APP_VRF_PROGRAM_ADDRESS || '';
export const VRF_PROGRAM_ID = new PublicKey(VRF_PROGRAM_ADDRESS);
