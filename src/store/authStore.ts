import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User, UserData, UploadingFile } from "../types";
import { api } from "../lib/api";
import { setApiTokens } from "../lib/api";

interface AuthState {
  user: User | null;
  phone: string;
  otpCode: string;
  otpSent: boolean;
  isNewUser: boolean;
  otpTimer: number;
  resendCount: number;
  isLoading: boolean;
  step: number;
  userData: UserData;
  uploadedDocs: Record<string, UploadingFile[]>;
  isDoctor: boolean;
  login: (role: Role, name?: string) => void;
  logout: () => void;
  setPhone: (phone: string) => void;
  sendOTP: (phone: string) => Promise<void>;
  verifyOTP: (
    code: string,
  ) => Promise<{ success: boolean; isNewUser: boolean; role?: string }>;
  decrementTimer: () => void;
  resetTimer: () => void;
  incrementResend: () => void;
  canResend: () => boolean;
  setStep: (step: number) => void;
  setUserData: (data: Partial<UserData>) => void;
  setIsDoctor: (v: boolean) => void;
  setUploadedDocs: (key: string, files: UploadingFile[]) => void;
  addUploadedDoc: (key: string, file: UploadingFile) => void;
  updateUploadProgress: (key: string, fileId: string, progress: number) => void;
  completeProfile: () => Promise<void>;
  reset: () => void;
}

const defaultUserData: UserData = {
  name: "",
  email: "",
  dateOfBirth: "",
  gender: "male",
  bloodType: "",
  allergies: [],
  chronicConditions: [],
  emergencyContact: { name: "", phone: "", relationship: "" },
  isDoctor: false,
  acceptTerms: false,
  acceptPrivacy: false,
  receiveNotifications: true,
  receivePromotions: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      phone: "",
      otpCode: "",
      otpSent: false,
      isNewUser: false,
      otpTimer: 120,
      resendCount: 0,
      isLoading: false,
      step: 1,
      userData: { ...defaultUserData },
      uploadedDocs: {},
      isDoctor: false,

      login: (role, name) => {
        const phone = get().phone;
        set({
          user: {
            id: `${role}-${Date.now()}`,
            name: name || "کاربر",
            role,
            avatar: "",
            phone,
          },
        });
      },

      logout: () => {
        setApiTokens(null);
        set({
          user: null,
          phone: "",
          otpCode: "",
          otpSent: false,
          isNewUser: false,
          otpTimer: 120,
          resendCount: 0,
          isLoading: false,
          step: 1,
          userData: { ...defaultUserData },
          uploadedDocs: {},
          isDoctor: false,
        });
      },

      setPhone: (phone) => set({ phone }),

      sendOTP: async (phone) => {
        set({ isLoading: true, phone, otpCode: "" });
        try {
          const response = await api.post<{ debugCode?: string; expiresIn: number }>(
            "/auth/send-otp/",
            { phone },
          );
          set({
            otpCode: response.debugCode || "",
            otpSent: true,
            isLoading: false,
            otpTimer: response.expiresIn || 120,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      verifyOTP: async (code) => {
        const { phone } = get();
        set({ isLoading: true });
        try {
          const response = await api.post<{
            access: string;
            refresh: string;
            user: User;
            isNewUser: boolean;
          }>("/auth/verify-otp/", { phone, code });
          setApiTokens({ access: response.access, refresh: response.refresh });
          set({
            user: response.isNewUser ? null : response.user,
            isLoading: false,
            isNewUser: response.isNewUser,
          });
          return {
            success: true,
            isNewUser: response.isNewUser,
            role: response.user.role,
          };
        } catch {
          set({ isLoading: false });
          return { success: false, isNewUser: false };
        }
      },

      decrementTimer: () => {
        const t = get().otpTimer;
        if (t > 0) set({ otpTimer: t - 1 });
      },

      resetTimer: () => set({ otpTimer: 120 }),

      incrementResend: () => set({ resendCount: get().resendCount + 1 }),

      canResend: () => get().resendCount < 3,

      setStep: (step) => set({ step }),

      setUserData: (data) => set({ userData: { ...get().userData, ...data } }),

      setIsDoctor: (v) => set({ isDoctor: v }),

      setUploadedDocs: (key, files) =>
        set({ uploadedDocs: { ...get().uploadedDocs, [key]: files } }),

      addUploadedDoc: (key, file) => {
        const existing = get().uploadedDocs[key] || [];
        set({
          uploadedDocs: { ...get().uploadedDocs, [key]: [...existing, file] },
        });
      },

      updateUploadProgress: (key, fileId, progress) => {
        const files = get().uploadedDocs[key] || [];
        set({
          uploadedDocs: {
            ...get().uploadedDocs,
            [key]: files.map((f) => (f.id === fileId ? { ...f, progress } : f)),
          },
        });
      },

      completeProfile: async () => {
        const { userData, isDoctor } = get();
        set({ isLoading: true });
        try {
          const user = await api.post<User>("/auth/complete-profile/", {
            ...userData,
            isDoctor,
          });
          set({
            user,
            isLoading: false,
            step: 1,
            userData: { ...defaultUserData },
            isDoctor: false,
            uploadedDocs: {},
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      reset: () =>
        set({
          phone: "",
          otpCode: "",
          otpSent: false,
          isNewUser: false,
          otpTimer: 120,
          resendCount: 0,
          isLoading: false,
          step: 1,
          userData: { ...defaultUserData },
          uploadedDocs: {},
          isDoctor: false,
        }),
    }),
    {
      name: "AvalDr-auth",
      partialize: (state) => ({
        user: state.user,
        phone: state.phone,
        isDoctor: state.isDoctor,
        userData: state.userData,
        uploadedDocs: state.uploadedDocs,
      }),
    },
  ),
);

export const homeFor = (role: Role) =>
  role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/user";
