import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import {
    PostChargeGraceModal,
    PostChargeGraceSession,
} from '../components/PostChargeGraceModal';

type StartPostChargeGraceInput = {
    stationName: string;
    connectorLabel: string;
    chargeEndedAtMs?: number;
    isChargerPluggedIn?: boolean;
    vehicleName?: string;
};

type PostChargeGraceContextValue = {
    activeGraceSession: PostChargeGraceSession | null;
    startPostChargeGrace: (session: StartPostChargeGraceInput) => void;
    markChargerUnplugged: () => void;
};

const PostChargeGraceContext = createContext<PostChargeGraceContextValue | undefined>(
    undefined
);

export function PostChargeGraceProvider({ children }: { children: React.ReactNode }) {
    const [activeGraceSession, setActiveGraceSession] =
        useState<PostChargeGraceSession | null>(null);
    const [showGracePopup, setShowGracePopup] = useState(false);

    const startPostChargeGrace = useCallback((session: StartPostChargeGraceInput) => {
        const isChargerPluggedIn = session.isChargerPluggedIn ?? true;

        setActiveGraceSession({
            ...session,
            chargeEndedAtMs: session.chargeEndedAtMs ?? Date.now(),
            isChargerPluggedIn,
        });
        setShowGracePopup(isChargerPluggedIn);
    }, []);

    const markChargerUnplugged = useCallback(() => {
        setActiveGraceSession((currentSession) =>
            currentSession
                ? { ...currentSession, isChargerPluggedIn: false }
                : currentSession
        );
        setShowGracePopup(false);
    }, []);

    const value = useMemo(
        () => ({
            activeGraceSession,
            startPostChargeGrace,
            markChargerUnplugged,
        }),
        [activeGraceSession, markChargerUnplugged, startPostChargeGrace]
    );

    return (
        <PostChargeGraceContext.Provider value={value}>
            {children}
            <PostChargeGraceModal
                session={activeGraceSession}
                visible={showGracePopup && Boolean(activeGraceSession?.isChargerPluggedIn)}
                onDismiss={() => setShowGracePopup(false)}
            />
        </PostChargeGraceContext.Provider>
    );
}

export function usePostChargeGrace() {
    const context = useContext(PostChargeGraceContext);

    if (!context) {
        throw new Error('usePostChargeGrace must be used inside PostChargeGraceProvider');
    }

    return context;
}
