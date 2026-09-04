import { create } from "zustand";

/**
 * Ephemeral UI state only. Auth and server data deliberately live elsewhere:
 * the session comes from Server Components and mirroring it here would drift.
 */
type UiState = {
  /** Mobile rail expanded to show labels. */
  sidebarExpanded: boolean;
  setSidebarExpanded: (value: boolean) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarExpanded: false,
  setSidebarExpanded: (value) => set({ sidebarExpanded: value }),
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
}));
