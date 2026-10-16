import React, { createContext, useContext, useEffect, useState } from 'react';
import { favoritesService } from '../services/api/favoritesService';

type FavoritesContextType = {
    favoriteIds: string[];
    isFavorite: (id: string) => boolean;
    toggleFavorite: (id: string) => void;
    addFavorite: (id: string) => void;
    removeFavorite: (id: string) => void;
    refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const DEFAULT_FAVORITES = ['1', '3', '4'];

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favoriteIds, setFavoriteIds] = useState<string[]>(DEFAULT_FAVORITES);

    const refreshFavorites = async () => {
        try {
            const liveFavorites = await favoritesService.getFavoriteStations();
            if (liveFavorites && liveFavorites.length > 0) {
                setFavoriteIds(liveFavorites.map((s) => s.id));
            }
        } catch {
            // Keep local state if unauthenticated or offline
        }
    };

    useEffect(() => {
        refreshFavorites();
    }, []);

    const isFavorite = (id: string) => favoriteIds.includes(id);

    const addFavorite = (id: string) => {
        setFavoriteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        favoritesService.addFavoriteStation(id).catch(() => {});
    };

    const removeFavorite = (id: string) => {
        setFavoriteIds((prev) => prev.filter((item) => item !== id));
        favoritesService.removeFavoriteStation(id).catch(() => {});
    };

    const toggleFavorite = (id: string) => {
        if (isFavorite(id)) {
            removeFavorite(id);
        } else {
            addFavorite(id);
        }
    };

    return (
        <FavoritesContext.Provider
            value={{
                favoriteIds,
                isFavorite,
                toggleFavorite,
                addFavorite,
                removeFavorite,
                refreshFavorites,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
