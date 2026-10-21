import React from 'react';
import { useAppMode } from '../../context/AppModeContext';
import GeminiChatScreen from '../AI/GeminiChatScreen';
import StationMapScreen from './StationMapScreen';

/**
 * Unified Home Screen Container
 * Dynamically switches between:
 * 1. Gemini AI Mode (minimal AI-chatbot style like Google Gemini app)
 * 2. Bento Grid Mode (interactive map & bento cards style)
 */
export default function HomeScreen(props: any) {
    const { mode } = useAppMode();

    if (mode === 'ai') {
        return <GeminiChatScreen {...props} />;
    }

    return <StationMapScreen {...props} />;
}
