import { atom } from "jotai";

export type Screen =
  | "home"
  | "introLoading"
  | "outage"
  | "outOfMinutes"
  | "intro"
  | "instructions"
  | "settings"
  | "conversation"
  | "conversationError"
  | "positiveFeedback"
  | "negativeFeedback"
  | "finalScreen"
  | "sessionEnded"
  | "auth"
  | "profile"
  | "chat";

interface ScreenState {
  currentScreen: Screen;
}

const initialScreenState: ScreenState = {
  currentScreen: "home",
};

export const screenAtom = atom<ScreenState>(initialScreenState);