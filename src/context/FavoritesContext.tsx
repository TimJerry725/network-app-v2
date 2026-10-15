import React, { createContext, useContext, useState } from 'react';

type FavoritesContextType = {
    favoriteIds: string[];
    isFavorite: (id: string) => boolean;
    toggleFavorite: (id: string) => void;
    addFavorite: (id: string) => void;
    removeFavorite: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const DEFAULT_FAVORITES = ['1', '3', '4'];

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favoriteIds, setFavoriteIds] = useState<string[]>(DEFAULT_FAVORITES);

    const isFavorite = (id: string) => favoriteIds.includes(id);

    const toggleFavorite = (id: string) => {
        setFavoriteIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const addFavorite = (id: string) => {
        setFavoriteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const removeFavorite = (id: string) => {
        setFavoriteIds((prev) => prev.filter((item) => item !== id));
    };

    return (
        <FavoritesContext.Provider
            value={{
                favoriteIds,
                isFavorite,
                toggleFavorite,
                addFavorite,
                removeFavorite,
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
