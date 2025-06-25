import { atom } from 'jotai';

export type ChatTab = 'chats' | 'users' | 'connections';

export const chatTabAtom = atom<ChatTab>('chats'); 