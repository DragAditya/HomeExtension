import { create } from 'zustand';
import type { SettingsSectionId } from '../lib/settings/types';

export type ToastTone = 'info' | 'success' | 'error';
export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type UIState = {
  settingsOpen: boolean;
  settingsSection: SettingsSectionId;
  paletteOpen: boolean;
  notesOpen: boolean;
  helpOpen: boolean;
  onboardingOpen: boolean;
  advanced: boolean;
  toasts: Toast[];
  openSettings: (section?: SettingsSectionId) => void;
  closeSettings: () => void;
  setSettingsSection: (section: SettingsSectionId) => void;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  openNotes: () => void;
  closeNotes: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  toggleAdvanced: () => void;
  toast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
  closeTop: () => void;
};

let toastSequence = 0;

export const useUI = create<UIState>((set, get) => ({
  settingsOpen: false,
  settingsSection: 'appearance',
  paletteOpen: false,
  notesOpen: false,
  helpOpen: false,
  onboardingOpen: false,
  advanced: false,
  toasts: [],

  openSettings: (section) =>
    set((state) => ({
      settingsOpen: true,
      settingsSection: section ?? state.settingsSection,
      paletteOpen: false,
      notesOpen: false,
      helpOpen: false,
      onboardingOpen: false,
    })),

  closeSettings: () => set({ settingsOpen: false }),

  setSettingsSection: (section) => set({ settingsSection: section }),

  openPalette: () =>
    set({ paletteOpen: true, settingsOpen: false, notesOpen: false, helpOpen: false }),
  closePalette: () => set({ paletteOpen: false }),
  togglePalette: () =>
    set((state) => ({
      paletteOpen: !state.paletteOpen,
      settingsOpen: false,
      notesOpen: false,
      helpOpen: false,
    })),

  openNotes: () =>
    set({ notesOpen: true, paletteOpen: false, settingsOpen: false, helpOpen: false }),
  closeNotes: () => set({ notesOpen: false }),

  openHelp: () =>
    set({ helpOpen: true, paletteOpen: false, settingsOpen: false, notesOpen: false }),
  closeHelp: () => set({ helpOpen: false }),

  openOnboarding: () =>
    set({
      onboardingOpen: true,
      settingsOpen: false,
      paletteOpen: false,
      notesOpen: false,
      helpOpen: false,
    }),
  closeOnboarding: () => set({ onboardingOpen: false }),

  toggleAdvanced: () => set((state) => ({ advanced: !state.advanced })),

  toast: (message, tone = 'info') => {
    const id = (toastSequence += 1);
    set((state) => ({ toasts: [...state.toasts.slice(-3), { id, message, tone }] }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
      }, 3600);
    }
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  closeTop: () => {
    const state = get();
    if (state.onboardingOpen) set({ onboardingOpen: false });
    else if (state.helpOpen) set({ helpOpen: false });
    else if (state.notesOpen) set({ notesOpen: false });
    else if (state.paletteOpen) set({ paletteOpen: false });
    else if (state.settingsOpen) set({ settingsOpen: false });
  },
}));
