import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
    ArrowUp,
    BatteryCharging,
    CheckCircle2,
    Compass,
    FileText,
    History,
    Mic,
    Plus,
    RotateCcw,
    Route,
    ScanLine,
    Send,
    Sparkles,
    Volume2,
    Zap,
} from 'lucide-react-native';

import { ThemedText } from '../../components/ThemedText';
import { GeminiModeSwitcher } from '../../components/GeminiModeSwitcher';
import { StationGenerativeWidget } from '../../components/generative/StationGenerativeWidget';
import { TripRouteGenerativeWidget } from '../../components/generative/TripRouteGenerativeWidget';
import { VehicleRangeGenerativeWidget } from '../../components/generative/VehicleRangeGenerativeWidget';
import { ReceiptGenerativeWidget } from '../../components/generative/ReceiptGenerativeWidget';
import { MOCK_STATIONS, Station } from '../../constants/Stations';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useIndiaChargingStations } from '../../hooks/useIndiaChargingStations';
import { useAppMode } from '../../context/AppModeContext';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'gemini';
    text: string;
    timestamp: string;
    widgetType?: 'station' | 'trip' | 'battery' | 'receipt';
    widgetData?: any;
    followUpChips?: string[];
}

export default function GeminiChatScreen({ navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { selectedVehicle, user } = useVehicles();
    const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Tim';
    const { stations: allStations } = useIndiaChargingStations();
    const { setMode } = useAppMode();

    const stationsList = allStations && allStations.length > 0 ? allStations : MOCK_STATIONS;

    const [inputQuery, setInputQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListeningVoice, setIsListeningVoice] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Initial Starter State
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Thinking Glow Animation
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        if (isThinking) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            glowAnim.setValue(0);
        }
    }, [isThinking, glowAnim]);

    const scrollToBottom = (delay = 100) => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, delay);
    };

    // Smart Intent Processor for Gemini EV Assistant
    const handleSendPrompt = (promptText?: string) => {
        const text = (promptText ?? inputQuery).trim();
        if (!text) return;

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputQuery('');
        setIsThinking(true);
        scrollToBottom(150);

        // Process query with intelligent EV charging intent engine
        setTimeout(() => {
            const lower = text.toLowerCase();
            let responseMsg: ChatMessage;

            // 1. Station & Charger Query
            if (
                lower.includes('charger') ||
                lower.includes('station') ||
                lower.includes('near') ||
                lower.includes('fast') ||
                lower.includes('cbe') ||
                lower.includes('dc') ||
                lower.includes('available')
            ) {
                const bestStation = stationsList[0] || MOCK_STATIONS[0];
                responseMsg = {
                    id: `gemini-${Date.now()}`,
                    sender: 'gemini',
                    text: `I found ${stationsList.length} fast charging hubs near you. **${bestStation.name}** is your best bet with ultra-fast 150 kW DC charging and available guns.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    widgetType: 'station',
                    widgetData: bestStation,
                    followUpChips: [
                        'Start charging on Gun 2',
                        'Show next nearest charger',
                        'Check queue wait time',
                    ],
                };
            }
            // 2. Trip & Route Planning Query
            else if (
                lower.includes('trip') ||
                lower.includes('route') ||
                lower.includes('plan') ||
                lower.includes('bangalore') ||
                lower.includes('bengaluru') ||
                lower.includes('ooty') ||
                lower.includes('chennai') ||
                lower.includes('mysore')
            ) {
                const recommendedCharger = {
                    id: 'cbe-sp-01',
                    name: 'Iris Thoppur Superhub',
                    location: 'Thoppur Valley Toll Plaza, NH 44',
                    distanceAlongRouteKm: 184,
                    powerKw: 150,
                    connectorType: 'CCS2 Dual Gun',
                    availableGuns: 4,
                    totalGuns: 4,
                    pricePerKWh: 18.00,
                    isRecommended: true,
                    arrivalSocPercent: 18,
                    departureSocPercent: 82,
                    recommendedChargeMin: 22,
                    amenities: ['Café Coffee Day', 'Food Court', 'Washrooms', 'AC Lounge'],
                };

                const routeChargers = [
                    {
                        id: 'iris-salem-01',
                        name: 'Iris Salem Bypass Hub',
                        location: 'Salem Outer Ring Road, NH 44',
                        distanceAlongRouteKm: 122,
                        powerKw: 60,
                        connectorType: 'CCS2',
                        availableGuns: 2,
                        totalGuns: 2,
                        pricePerKWh: 16.00,
                        isRecommended: false,
                        arrivalSocPercent: 44,
                        amenities: ['Restaurant', 'Washroom'],
                    },
                    recommendedCharger,
                    {
                        id: 'iris-krishnagiri-01',
                        name: 'Iris Krishnagiri Express Point',
                        location: 'Krishnagiri Highway Plaza, NH 44',
                        distanceAlongRouteKm: 268,
                        powerKw: 120,
                        connectorType: 'CCS2',
                        availableGuns: 3,
                        totalGuns: 4,
                        pricePerKWh: 17.00,
                        isRecommended: false,
                        arrivalSocPercent: 54,
                        amenities: ['Food Court', 'ATM'],
                    },
                    {
                        id: 'iris-hosur-01',
                        name: 'Iris Hosur Gateway Hub',
                        location: 'Hosur Border Plaza, Attibele, NH 44',
                        distanceAlongRouteKm: 328,
                        powerKw: 60,
                        connectorType: 'CCS2',
                        availableGuns: 2,
                        totalGuns: 2,
                        pricePerKWh: 16.50,
                        isRecommended: false,
                        arrivalSocPercent: 36,
                        amenities: ['Retail Plaza', 'Restroom'],
                    },
                ];

                responseMsg = {
                    id: `gemini-${Date.now()}`,
                    sender: 'gemini',
                    text: `Here is your optimized route from **Coimbatore to Bangalore (365 km)** with **Iris Thoppur Superhub (150 kW)** as your recommended fast stop (+22 mins). I've also mapped **4 fast chargers stationed along NH 44** for backup reassurance.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    widgetType: 'trip',
                    widgetData: {
                        origin: 'Coimbatore',
                        destination: 'Bangalore',
                        distanceKm: 365,
                        durationHours: '5h 15m',
                        chargingStopsCount: 1,
                        chargingTimeMin: 22,
                        recommendedStop: 'Iris Thoppur Superhub (150 kW)',
                        recommendedCharger,
                        routeChargers,
                        energyKWh: 48.5,
                    },
                    followUpChips: [
                        'Reserve Gun 2 at Thoppur',
                        'Show chargers on Salem bypass',
                        'Check elevation drain profile',
                    ],
                };
            }
            // 3. Battery & Vehicle Range Query
            else if (
                lower.includes('battery') ||
                lower.includes('range') ||
                lower.includes('soc') ||
                lower.includes('nexon') ||
                lower.includes('vehicle') ||
                lower.includes('car') ||
                lower.includes('charge level')
            ) {
                responseMsg = {
                    id: `gemini-${Date.now()}`,
                    sender: 'gemini',
                    text: `Your **${selectedVehicle?.model || 'Tata Nexon EV'}** currently has **68% SOC** with an estimated range of **218 km**. Battery health is in optimum condition.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    widgetType: 'battery',
                    widgetData: {
                        modelName: selectedVehicle?.model || 'Tata Nexon EV Long Range',
                        socPercent: 68,
                        rangeKm: 218,
                        batteryCapacityKWh: 40.5,
                        healthPercent: 98,
                        maxDcRateKw: 50,
                    },
                    followUpChips: [
                        'Find chargers within 200km',
                        'Tips to extend battery life',
                        'View full diagnostics',
                    ],
                };
            }
            // 4. Billing, Receipts & Spend Query
            else if (
                lower.includes('receipt') ||
                lower.includes('bill') ||
                lower.includes('cost') ||
                lower.includes('history') ||
                lower.includes('spend') ||
                lower.includes('invoice') ||
                lower.includes('session')
            ) {
                responseMsg = {
                    id: `gemini-${Date.now()}`,
                    sender: 'gemini',
                    text: `Here is the receipt from your most recent fast charging session at **Casa Grand Techno City**. You added **18.4 kWh** in 28 minutes.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    widgetType: 'receipt',
                    widgetData: {
                        stationName: 'Casa Grand Techno City',
                        invoiceNo: 'INV-2026-10-891',
                        dateFormatted: 'Today, 9:42 AM',
                        energyKWh: 18.4,
                        durationMin: 28,
                        totalAmount: 386.40,
                        co2AvoidedKg: 15.2,
                    },
                    followUpChips: [
                        'Download tax invoice',
                        'Show monthly charging total',
                        'Report an issue',
                    ],
                };
            }
            // 5. General EV Knowledge & Assistance
            else {
                responseMsg = {
                    id: `gemini-${Date.now()}`,
                    sender: 'gemini',
                    text: `I'm your **Iris EV Copilot**. I can locate ultra-fast DC chargers, calculate battery range curves, plan long-distance routes with optimal charging stops, and manage your live charging sessions.\n\nTry asking:\n• *"Find 60kW+ chargers near me"*\n• *"Plan trip to Bangalore with stops"*\n• *"Check my battery range and health"*\n• *"Show my last charging receipt"*`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    followUpChips: [
                        '⚡ Fast chargers near me',
                        '🛣 Plan route to Bangalore',
                        '🔋 Check battery status',
                        '💳 View last receipt',
                    ],
                };
            }

            setIsThinking(false);
            setMessages((prev) => [...prev, responseMsg]);
            scrollToBottom(150);
        }, 650);
    };

    // Quick Starter Intents
    const starterIntents = [
        {
            id: 'fast-dc',
            title: 'Nearest DC Fast Chargers',
            sub: '60kW+ stations with live open guns',
            icon: <Zap size={16} color="#38BDF8" fill="#38BDF8" />,
            query: 'Find 60kW+ DC fast chargers near me',
            themeColor: '#38BDF8',
        },
        {
            id: 'trip',
            title: 'Plan Route with Charging',
            sub: 'Coimbatore → Bangalore with stops',
            icon: <Route size={16} color="#FF5B45" />,
            query: 'Plan trip from Coimbatore to Bangalore with fast charging stops',
            themeColor: '#FF5B45',
        },
        {
            id: 'battery',
            title: 'Vehicle Range & Battery',
            sub: '68% SOC • 218 km remaining range',
            icon: <BatteryCharging size={16} color="#10B981" />,
            query: 'Check my battery range and vehicle health',
            themeColor: '#10B981',
        },
        {
            id: 'receipt',
            title: 'Last Charging Receipt',
            sub: 'Invoice, kWh delivered & ₹ spend',
            icon: <FileText size={16} color="#F59E0B" />,
            query: 'Show my latest charging receipt and spend',
            themeColor: '#F59E0B',
        },
    ];

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            {/* Top Ambient Glow Halo */}
            <LinearGradient
                colors={
                    isDark
                        ? ['rgba(56, 189, 248, 0.16)', 'rgba(129, 140, 248, 0.08)', 'transparent']
                        : ['rgba(56, 189, 248, 0.12)', 'rgba(255, 91, 69, 0.06)', 'transparent']
                }
                style={styles.ambientGlow}
                pointerEvents="none"
            />

            {/* Top Glassmorphic Header */}
            <View
                style={[
                    styles.header,
                    {
                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                    },
                ]}
            >
                {/* Brand / Logo */}
                <View style={styles.brandGroup}>
                    <LinearGradient
                        colors={['#38BDF8', '#818CF8', '#FF5B45']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.sparkleIconCircle}
                    >
                        <Sparkles size={16} color="#FFFFFF" />
                    </LinearGradient>
                    <View>
                        <ThemedText style={styles.brandTitle}>Iris AI</ThemedText>
                        <ThemedText style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                            EV Copilot
                        </ThemedText>
                    </View>
                </View>

                {/* Right Controls: Mode Switcher & Reset */}
                <View style={styles.headerRightControls}>
                    {/* The Mode Switcher to jump between Gemini AI and Bento Grid */}
                    <GeminiModeSwitcher compact={true} />

                    {messages.length > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.headerIconBtn,
                                {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                                },
                            ]}
                            activeOpacity={0.75}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setMessages([]);
                            }}
                        >
                            <RotateCcw size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Main Chat Scroll Area */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={[
                        styles.scrollContent,
                        messages.length === 0 && styles.emptyScrollContent,
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Zero-State Greeting & Gemini Starter Cards */}
                    {messages.length === 0 ? (
                        <View style={styles.starterContainer}>
                            <View style={styles.greetingHeader}>
                                <LinearGradient
                                    colors={['#38BDF8', '#818CF8', '#FF5B45']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.greetingGradientPill}
                                >
                                    <Sparkles size={12} color="#FFFFFF" />
                                    <ThemedText style={styles.greetingPillText}>
                                        Iris AI • EV Intelligence
                                    </ThemedText>
                                </LinearGradient>

                                <ThemedText
                                    style={[
                                        styles.greetingTitle,
                                        { color: isDark ? '#FFFFFF' : '#0A0D14' },
                                    ]}
                                >
                                    Hello, {firstName}
                                </ThemedText>
                                <ThemedText
                                    style={[
                                        styles.greetingSubtitle,
                                        { color: isDark ? 'rgba(255, 255, 255, 0.70)' : '#475569' },
                                    ]}
                                >
                                    How can I assist your journey and charging today?
                                </ThemedText>
                            </View>

                            {/* 4 Gemini-Style Intent Cards */}
                            <View style={styles.starterGrid}>
                                {starterIntents.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.intentCard,
                                            {
                                                backgroundColor: isDark ? '#14151E' : '#FFFFFF',
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                            },
                                        ]}
                                        activeOpacity={0.82}
                                        onPress={() => handleSendPrompt(item.query)}
                                    >
                                        <View
                                            style={[
                                                styles.intentIconCircle,
                                                { backgroundColor: isDark ? '#1F2230' : '#F1F5F9' },
                                            ]}
                                        >
                                            {item.icon}
                                        </View>
                                        <ThemedText style={styles.intentTitle} numberOfLines={1}>
                                            {item.title}
                                        </ThemedText>
                                        <ThemedText style={[styles.intentSub, { color: colors.textMuted }]} numberOfLines={2}>
                                            {item.sub}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        /* Message Feed */
                        messages.map((msg) => (
                            <View
                                key={msg.id}
                                style={[
                                    styles.messageRow,
                                    msg.sender === 'user' ? styles.userRow : styles.geminiRow,
                                ]}
                            >
                                {msg.sender === 'gemini' && (
                                    <LinearGradient
                                        colors={['#38BDF8', '#818CF8', '#FF5B45']}
                                        style={styles.messageGeminiAvatar}
                                    >
                                        <Sparkles size={12} color="#FFFFFF" />
                                    </LinearGradient>
                                )}

                                <View style={styles.messageBubbleWrap}>
                                    <View
                                        style={[
                                            styles.messageBubble,
                                            msg.sender === 'user'
                                                ? [
                                                      styles.userBubble,
                                                      {
                                                          backgroundColor: isDark ? '#232533' : '#F1F5F9',
                                                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                                                      },
                                                  ]
                                                : [
                                                      styles.geminiBubble,
                                                      {
                                                          backgroundColor: isDark ? '#14151E' : '#FFFFFF',
                                                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                                      },
                                                  ],
                                        ]}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.messageText,
                                                { color: msg.sender === 'user' ? colors.text : colors.text },
                                            ]}
                                        >
                                            {msg.text}
                                        </ThemedText>
                                    </View>

                                    {/* Generative UI Components rendered inline */}
                                    {msg.widgetType === 'station' && msg.widgetData && (
                                        <StationGenerativeWidget
                                            station={msg.widgetData}
                                            onNavigate={(st) => {
                                                navigation.navigate('StationDetails', { stationId: st.id });
                                            }}
                                            onStartCharge={(st) => {
                                                navigation.navigate('Scan');
                                            }}
                                        />
                                    )}

                                    {msg.widgetType === 'trip' && msg.widgetData && (
                                        <TripRouteGenerativeWidget
                                            {...msg.widgetData}
                                            onOpenTripPlanner={() => {
                                                navigation.navigate('Explore');
                                            }}
                                            onSelectCharger={(charger) => {
                                                navigation.navigate('StationDetails', { stationId: charger.id });
                                            }}
                                            onStartCharge={(charger) => {
                                                navigation.navigate('Scan');
                                            }}
                                        />
                                    )}

                                    {msg.widgetType === 'battery' && msg.widgetData && (
                                        <VehicleRangeGenerativeWidget
                                            {...msg.widgetData}
                                            onManageVehicle={() => {
                                                navigation.navigate('Vehicles');
                                            }}
                                        />
                                    )}

                                    {msg.widgetType === 'receipt' && msg.widgetData && (
                                        <ReceiptGenerativeWidget
                                            {...msg.widgetData}
                                            onViewReceipt={() => {
                                                navigation.navigate('Vehicles');
                                            }}
                                        />
                                    )}

                                    {/* Follow Up Suggestion Chips */}
                                    {msg.followUpChips && msg.followUpChips.length > 0 && (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.followUpScroll}
                                            contentContainerStyle={styles.followUpContainer}
                                        >
                                            {msg.followUpChips.map((chip, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={[
                                                        styles.followUpPill,
                                                        {
                                                            backgroundColor: isDark ? '#1C1D27' : '#F3F4F6',
                                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                                        },
                                                    ]}
                                                    activeOpacity={0.8}
                                                    onPress={() => handleSendPrompt(chip)}
                                                >
                                                    <ThemedText style={[styles.followUpText, { color: colors.text }]}>
                                                        {chip}
                                                    </ThemedText>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            </View>
                        ))
                    )}

                    {/* Gemini Thinking / Streaming Indicator */}
                    {isThinking && (
                        <View style={[styles.messageRow, styles.geminiRow]}>
                            <LinearGradient
                                colors={['#38BDF8', '#818CF8', '#FF5B45']}
                                style={styles.messageGeminiAvatar}
                            >
                                <Sparkles size={12} color="#FFFFFF" />
                            </LinearGradient>
                            <Animated.View
                                style={[
                                    styles.thinkingPill,
                                    {
                                        backgroundColor: isDark ? '#151722' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.2)',
                                        opacity: glowAnim,
                                    },
                                ]}
                            >
                                <ActivityIndicator size="small" color="#38BDF8" style={{ marginRight: 8 }} />
                                <ThemedText style={styles.thinkingText}>
                                    Iris is analyzing charging network...
                                </ThemedText>
                            </Animated.View>
                        </View>
                    )}
                </ScrollView>

                {/* Iris AI Ambient Bottom Bar & Prompt Composer */}
                <View
                    style={[
                        styles.composerWrapper,
                        {
                            backgroundColor: isDark ? 'rgba(10, 11, 16, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            paddingBottom: isKeyboardVisible
                                ? 10
                                : Math.max(insets.bottom, 12),
                            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                        },
                    ]}
                >
                    {/* Floating Sticky Scan Action Icon Button (outside input section in right corner) */}
                    <TouchableOpacity
                        style={styles.floatingScanFab}
                        activeOpacity={0.85}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            navigation.navigate('Scan');
                        }}
                    >
                        <LinearGradient
                            colors={['#FF5B45', '#FF7A66']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.floatingScanGradient}
                        >
                            <ScanLine size={24} color="#FFFFFF" strokeWidth={2.4} />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Prompt Input Capsule */}
                    <View
                        style={[
                            styles.inputPill,
                            {
                                backgroundColor: isDark ? '#161823' : '#F3F4F6',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                    >
                        {/* Plus Action Button */}
                        <TouchableOpacity
                            style={styles.inputActionCircle}
                            activeOpacity={0.75}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleSendPrompt('Find 60kW+ DC fast chargers near me');
                            }}
                        >
                            <Plus size={18} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Text Field */}
                        <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="Ask Iris anything about charging..."
                            placeholderTextColor={colors.textMuted}
                            value={inputQuery}
                            onChangeText={setInputQuery}
                            onSubmitEditing={() => handleSendPrompt()}
                            returnKeyType="send"
                            multiline={false}
                        />

                        {/* Voice waveform / Mic button */}
                        <TouchableOpacity
                            style={[
                                styles.micCircle,
                                isListeningVoice && { backgroundColor: 'rgba(255, 91, 69, 0.2)' },
                            ]}
                            activeOpacity={0.75}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setIsListeningVoice(true);
                                setInputQuery('Find 60kW+ fast chargers near me');
                                setTimeout(() => {
                                    setIsListeningVoice(false);
                                    handleSendPrompt('Find 60kW+ fast chargers near me');
                                }, 800);
                            }}
                        >
                            <Mic size={17} color={isListeningVoice ? '#FF5B45' : colors.textMuted} />
                        </TouchableOpacity>

                        {/* Send Trigger Button */}
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                {
                                    backgroundColor: inputQuery.trim() ? '#38BDF8' : (isDark ? '#262939' : '#E2E8F0'),
                                },
                            ]}
                            activeOpacity={0.82}
                            onPress={() => handleSendPrompt()}
                            disabled={!inputQuery.trim()}
                        >
                            <ArrowUp size={16} color={inputQuery.trim() ? '#081726' : colors.textMuted} strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    ambientGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 240,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    brandGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    sparkleIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandTitle: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.2,
    },
    brandSubtitle: {
        fontSize: 10,
        fontFamily: FONT_FAMILIES.medium,
    },
    headerRightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingTop: 16,
        paddingBottom: 76,
    },
    emptyScrollContent: {
        flexGrow: 1,
    },
    starterContainer: {
        paddingTop: 8,
        paddingBottom: 20,
    },
    greetingHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    greetingGradientPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        marginBottom: 10,
    },
    greetingPillText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.4,
    },
    greetingTitle: {
        fontSize: 30,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 6,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    greetingSubtitle: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.regular,
        textAlign: 'center',
        maxWidth: 290,
        lineHeight: 20,
    },
    starterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    intentCard: {
        width: '48.4%',
        borderRadius: RADIUS.card,
        padding: 13,
        borderWidth: 1.2,
    },
    intentIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    intentTitle: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
        marginBottom: 3,
    },
    intentSub: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.regular,
        lineHeight: 15,
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 8,
        alignItems: 'flex-start',
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    geminiRow: {
        justifyContent: 'flex-start',
    },
    messageGeminiAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginTop: 4,
    },
    messageBubbleWrap: {
        maxWidth: '86%',
    },
    messageBubble: {
        paddingHorizontal: 15,
        paddingVertical: 11,
        borderRadius: 18,
        borderWidth: 1,
    },
    userBubble: {
        borderBottomRightRadius: 4,
        alignSelf: 'flex-end',
    },
    geminiBubble: {
        borderTopLeftRadius: 4,
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 21,
        fontFamily: FONT_FAMILIES.regular,
    },
    followUpScroll: {
        marginTop: 8,
    },
    followUpContainer: {
        gap: 6,
    },
    followUpPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    followUpText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    thinkingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        marginTop: 4,
    },
    thinkingText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        color: '#38BDF8',
    },
    floatingScanFab: {
        position: 'absolute',
        top: -60,
        right: 18,
        width: 50,
        height: 50,
        borderRadius: 25,
        shadowColor: '#FF5B45',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.40,
        shadowRadius: 10,
        elevation: 9,
        zIndex: 9999,
    },
    floatingScanGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.28)',
    },
    composerWrapper: {
        paddingHorizontal: SPACING.md,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    inputPill: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: RADIUS.pill,
        paddingHorizontal: 6,
        borderWidth: 1,
    },
    inputActionCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        height: 44,
        paddingHorizontal: 8,
        fontSize: 13,
        fontFamily: FONT_FAMILIES.regular,
    },
    micCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    sendButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
