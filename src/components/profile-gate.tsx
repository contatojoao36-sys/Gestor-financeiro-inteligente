"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Wallet2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { EMPTY_STATE } from "@/lib/seed";
import { PROFILES, getActiveProfileId, setActiveProfileId, clearActiveProfileId, profileScopedKey, getProfileName } from "@/lib/profiles";

interface ProfileContextValue {
  profileId: string;
  profileName: string;
  switchProfile: () => void;
}

const ProfileContext = React.createContext<ProfileContextValue | null>(null);

export function useActiveProfile() {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) throw new Error("useActiveProfile deve ser usado dentro de ProfileGate");
  return ctx;
}

/** Troca para outro perfil (ou carrega os dados dele) sem perder dados de nenhum dos dois. */
function loadProfile(id: string) {
  setActiveProfileId(id);
  const hasExistingData = localStorage.getItem(profileScopedKey("gfi-storage")) !== null;
  if (hasExistingData) {
    useAppStore.persist.rehydrate();
  } else {
    useAppStore.setState({ ...EMPTY_STATE, hydrated: true });
  }
}

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const [profileId, setProfileId] = React.useState<string | null | undefined>(undefined);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura do localStorage só é possível no cliente, após montar
    setProfileId(getActiveProfileId());
  }, []);

  function choose(id: string) {
    loadProfile(id);
    setProfileId(id);
  }

  function switchProfile() {
    clearActiveProfileId();
    useAppStore.setState({ ...EMPTY_STATE, hydrated: true });
    setProfileId(null);
  }

  if (profileId === undefined) {
    return <div className="min-h-screen bg-background" />;
  }

  if (profileId === null) {
    return <ProfileSelectScreen onChoose={choose} />;
  }

  return (
    <ProfileContext.Provider value={{ profileId, profileName: getProfileName(profileId), switchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

function ProfileSelectScreen({ onChoose }: { onChoose: (id: string) => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wallet2 className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold">Quem está usando o Gestor Financeiro?</h1>
        <p className="text-sm text-muted">Cada pessoa tem seus próprios dados, totalmente separados.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {PROFILES.map((profile, i) => (
          <motion.button
            key={profile.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChoose(profile.id)}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-semibold text-primary ring-2 ring-transparent transition-all group-hover:ring-primary">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{profile.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
