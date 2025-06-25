import { atom } from "jotai";

export interface UserProfile {
  id?: string;
  email?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  fullName: string;
  birthday?: string;
  bio: string;
  job: string;
  fashion: string;
  age?: number;
  relationshipStatus: string;
  location?: string;
  interests?: string[];
  website?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

const getInitialProfile = (): UserProfile => {
  const savedProfile = localStorage.getItem('user-profile');
  if (savedProfile) {
    return JSON.parse(savedProfile);
  }
  return {
    fullName: "",
    bio: "",
    job: "",
    fashion: "",
    relationshipStatus: "prefer-not-to-say",
    interests: [],
  };
};

export const userProfileAtom = atom<UserProfile>(getInitialProfile());

export const profileSavedAtom = atom<boolean>(false);

// Derived atom to check if profile is complete
export const isProfileCompleteAtom = atom((get) => {
  const profile = get(userProfileAtom);
  return !!(profile.fullName && profile.bio);
});