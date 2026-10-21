import React from 'react';
import { useAppMode } from '../../context/AppModeContext';
import GeminiChatScreen from '../AI/GeminiChatScreen';
import StationMapScreen from './StationMapScreen';

/**
 * Unified Home Screen Container
 * Dynamically switches between:
 * 1. Iris AI Mode (minimal AI-chatbot style EV copilot)
 * 2. Map Mode (interactive map & station cards)
 */
export default function HomeScreen(props: any) {
    const { mode } = useAppMode();

    if (mode === 'ai') {
        return <GeminiChatScreen {...props} />;
    }

    return <StationMapScreen {...props} />;
}
