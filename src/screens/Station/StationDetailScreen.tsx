import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    Heart,
    Share2,
    MapPin,
    Clock,
    Navigation,
    Zap,
    Utensils,
    Hotel,
    Users,
    ChevronRight,
    PhoneCall,
    Wallet,
    Plus,
    X,
    Check,
} from 'lucide-react-native';
import { ThemedText } from '../../components/ThemedText';
import { Ccs2Icon } from '../../components/Ccs2Icon';
import { Type2Icon } from '../../components/Type2Icon';
import { ChademoIcon } from '../../components/ChademoIcon';
import {
    Connector,
    MOCK_STATIONS,
    Station,
    getStationById,
} from '../../constants/Stations';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';
import { useFavorites } from '../../context/FavoritesContext';
import { stationService } from '../../services/api/stationService';

// Helper to render connector icon with type badge pod
function ConnectorBadge({
    type,
    isSelected = false,
    isDark = false,
    compact = false,
}: {
    type: Connector['type'];
    isSelected?: boolean;
    isDark?: boolean;
    compact?: boolean;
}) {
    const iconColor = isDark
        ? (isSelected ? '#FFFFFF' : '#E5E5EA')
        : (isSelected ? '#000000' : '#1C1C22');
    const iconSize = 26;

    return (
        <View style={styles.connectorIconContainer}>
            {type === 'CCS2' ? (
                <Ccs2Icon size={iconSize} color={iconColor} />
            ) : type === 'Type 2' ? (
                <Type2Icon size={iconSize} color={iconColor} />
            ) : (
                <ChademoIcon size={iconSize} color={iconColor} />
            )}
            <ThemedText style={[styles.connectorSublabel, { color: iconColor }]}>
                {type}
            </ThemedText>
        </View>
    );
}

export default function StationDetailScreen({ route, navigation }: any) {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { user, topUpWallet } = useVehicles();

    const [liveStation, setLiveStation] = useState<Station | null>(null);

    const routeStation: Station | undefined = route.params?.stationSnapshot ?? route.params?.station;

    const station: Station =
        liveStation ??
        routeStation ??
        getStationById(route.params?.stationId) ??
        MOCK_STATIONS.find((item) => item.id === route.params?.stationId) ??
        MOCK_STATIONS[0];

    useEffect(() => {
        const id = route.params?.stationId ?? station.id;
        if (!id) return;
        stationService.getPublicStationDetails(id)
            .then((data) => {
                if (data) setLiveStation(data);
            })
            .catch(() => {});
    }, [route.params?.stationId]);

    const { isFavorite, toggleFavorite } = useFavorites();
    const isFav = isFavorite(station.id);
    const [showTariffModal, setShowTariffModal] = useState(false);
    const [smartCutoffModal, setSmartCutoffModal] = useState(false);
    const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(
        station.connectors[0]?.id ?? null
    );
    const [cutoffPercent, setCutoffPercent] = useState('80%');

    // Track Charger Status state per charger group
    const [trackedChargers, setTrackedChargers] = useState<Record<string, number>>({
        CP1233: 59 * 60 + 30, // 59 min 30 sec
    });

    // Live countdown for tracked chargers
    useEffect(() => {
        const interval = setInterval(() => {
            setTrackedChargers((prev) => {
                const next: Record<string, number> = {};
                let changed = false;
                Object.entries(prev).forEach(([id, secs]) => {
                    if (secs > 0) {
                        next[id] = secs - 1;
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleTrackCharger = (key: string) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setTrackedChargers((prev) => {
            const copy = { ...prev };
            if (copy[key]) {
                delete copy[key];
            } else {
                copy[key] = 59 * 60 + 30;
            }
            return copy;
        });
    };

    const formatCountdown = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins} min ${secs < 10 ? `0${secs}` : secs} sec`;
    };

    // Group connectors by chargerId (e.g. CP1233, CP1234)
    const chargerGroups = useMemo(() => {
        const groups: { [key: string]: Connector[] } = {};
        station.connectors.forEach((conn, idx) => {
            const chargerKey = conn.chargerId || (idx < 2 ? 'CP1233' : 'CP1234');
            if (!groups[chargerKey]) {
                groups[chargerKey] = [];
            }
            groups[chargerKey].push(conn);
        });
        return Object.entries(groups).map(([chargerId, connectors], index) => ({
            groupKey: `${chargerId}-${index}`,
            displayId: chargerId,
            chargerId,
            connectors,
        }));
    }, [station.connectors]);

    const handleShare = async () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        try {
            await Share.share({
                title: station.name,
                message: `${station.name} — ${station.address}`,
            });
        } catch (e) {
            /* noop */
        }
    };

    const handleGetDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
        Linking.openURL(url).catch(() =>
            Alert.alert('Directions', `Navigating to ${station.name}`)
        );
    };

    const handleHelpSupport = () => {
        Alert.alert('Help & Support', 'Our support team is available 24/7.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Call 1800-419-IRIS',
                onPress: () => Linking.openURL('tel:18004194747'),
            },
        ]);
    };

    const handleStartCharging = (connector: Connector) => {
        const parsedCutoff = parseInt(cutoffPercent, 10) || 85;
        navigation.navigate('ChargingSession', {
            stationId: station.id,
            stationSnapshot: station,
            connectorId: connector.id,
            targetSoc: parsedCutoff,
        });
    };

    const gallery = station.galleryImages ?? [
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1558441719-7d885a5a7b63?auto=format&fit=crop&q=80&w=600',
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Top App Bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.goBack();
                        }}
                        style={[
                            styles.tactileCircleBtn,
                            {
                                backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                        activeOpacity={0.8}
                    >
                        <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
                    </TouchableOpacity>

                    <ThemedText style={[styles.stationTitle, { color: colors.text }]} numberOfLines={1}>
                        {station.name}
                    </ThemedText>

                    <View style={styles.topBarActions}>
                        <TouchableOpacity
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                toggleFavorite(station.id);
                            }}
                            style={[
                                styles.tactileCircleBtn,
                                {
                                    backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                },
                            ]}
                            activeOpacity={0.8}
                        >
                            <Heart
                                size={18}
                                color={isFav ? '#EF4444' : colors.text}
                                fill={isFav ? '#EF4444' : 'none'}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleShare}
                            style={[
                                styles.tactileCircleBtn,
                                {
                                    backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                },
                            ]}
                            activeOpacity={0.8}
                        >
                            <Share2 size={17} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Subtitle / Address ── */}
                <View style={styles.addressRow}>
                    <MapPin size={13} color={colors.coral} style={{ marginTop: 1 }} />
                    <ThemedText style={[styles.addressText, { color: colors.textMuted }]} numberOfLines={1}>
                        {station.address}
                    </ThemedText>
                </View>

                {/* ── Meta Pills (Open | Timing | Kms & ETA) ── */}
                <View style={styles.pillsRow}>
                    <View
                        style={[
                            styles.openPill,
                            {
                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#86EFAC',
                            },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.openPillText,
                                { color: isDark ? '#34D399' : '#14532D' },
                            ]}
                        >
                            OPEN
                        </ThemedText>
                    </View>

                    <View
                        style={[
                            styles.grayPill,
                            {
                                backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                    >
                        <Clock size={12} color={colors.textMuted} />
                        <ThemedText style={[styles.grayPillText, { color: colors.text }]}>
                            {station.openTime} - {station.closeTime}
                        </ThemedText>
                    </View>

                    <View
                        style={[
                            styles.grayPill,
                            {
                                backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                    >
                        <Navigation size={12} color={colors.lavender} />
                        <ThemedText style={[styles.grayPillText, { color: colors.text }]}>
                            {station.distanceKm} Kms | <ThemedText style={[styles.etaBold, { color: colors.text }]}>ETA:</ThemedText> {station.etaMinutes} Mins
                        </ThemedText>
                    </View>
                </View>

                {/* ── Amenities Row ── */}
                <View style={styles.amenitiesRow}>
                    {station.amenities.map((item, index) => {
                        let IconComp = Utensils;
                        if (item.toLowerCase().includes('hotel')) IconComp = Hotel;
                        if (item.toLowerCase().includes('washroom') || item.toLowerCase().includes('restroom')) {
                            IconComp = Users;
                        }
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.amenityItem,
                                    {
                                        backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                    },
                                ]}
                            >
                                <IconComp size={13} color={colors.textMuted} />
                                <ThemedText style={[styles.amenityText, { color: colors.text }]}>{item}</ThemedText>
                            </View>
                        );
                    })}
                </View>

                {/* ── Photo Gallery Carousel ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryScroll}
                >
                    {gallery.map((imgUri, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.galleryImageWrap,
                                {
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                },
                            ]}
                        >
                            <Image
                                source={{ uri: imgUri }}
                                style={styles.galleryImage}
                                resizeMode="cover"
                            />
                        </View>
                    ))}
                </ScrollView>

                {/* ── Charger Cards Section ── */}
                <View style={styles.chargersSection}>
                    {chargerGroups.map((group) => {
                        const trackingSecs = trackedChargers[group.chargerId];
                        const isTracking = Boolean(trackingSecs && trackingSecs > 0);

                        return (
                            <View
                                key={group.groupKey}
                                style={[
                                    styles.chargerCard,
                                    {
                                        backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                    },
                                ]}
                            >
                                {/* Card Header */}
                                <View style={styles.chargerHeader}>
                                    <View style={styles.chargerTitleGroup}>
                                        <ThemedText style={[styles.chargerBoldLabel, { color: colors.text }]}>
                                            Charger
                                        </ThemedText>
                                        <ThemedText style={[styles.chargerCode, { color: colors.textMuted }]}>
                                            {group.chargerId}
                                        </ThemedText>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => toggleTrackCharger(group.chargerId)}
                                        activeOpacity={0.8}
                                        style={[
                                            styles.trackStatusBtn,
                                            isTracking
                                                ? {
                                                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                                                      borderColor: '#EF4444',
                                                  }
                                                : {
                                                      backgroundColor: isDark ? '#1C1D26' : '#F6F6F8',
                                                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                                                  },
                                        ]}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.trackStatusBtnText,
                                                { color: isTracking ? '#DC2626' : colors.text },
                                            ]}
                                        >
                                            {isTracking
                                                ? 'Stop Tracking'
                                                : 'Track Charger Status'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>

                                {/* Availability Tracking Countdown Banner */}
                                {isTracking && (
                                    <View
                                        style={[
                                            styles.trackingBanner,
                                            {
                                                backgroundColor: isDark ? '#1C1D26' : '#F4F4F6',
                                                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                            },
                                        ]}
                                    >
                                        <ThemedText style={[styles.trackingBannerText, { color: colors.textMuted }]}>
                                            Availability tracking ends in{' '}
                                            <ThemedText style={[styles.trackingTimerBold, { color: colors.text }]}>
                                                {formatCountdown(trackingSecs)}
                                            </ThemedText>
                                        </ThemedText>
                                    </View>
                                )}

                                {/* Connector Cards inside Charger */}
                                <View style={styles.connectorsStack}>
                                    {group.connectors.map((connector) => {
                                        const isSelected = selectedConnectorId === connector.id;
                                        const isAvailable = connector.status === 'Available';
                                        const isPreparing = connector.status === 'Preparing';
                                        const currentType =
                                            connector.currentType ??
                                            (connector.type === 'Type 2' ? 'AC' : 'DC');

                                        return (
                                            <TouchableOpacity
                                                key={connector.id}
                                                activeOpacity={0.88}
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                    }
                                                    setSelectedConnectorId(connector.id);
                                                }}
                                                style={[
                                                    styles.connectorWholeCard,
                                                    isSelected
                                                        ? [
                                                              styles.connectorCardSelected,
                                                              {
                                                                  backgroundColor: isDark ? '#1C1D26' : '#FFFFFF',
                                                                  borderColor: colors.coral,
                                                              },
                                                          ]
                                                        : [
                                                              styles.connectorCardUnselected,
                                                              {
                                                                  backgroundColor: isDark ? '#121319' : '#F7F7F9',
                                                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                                                              },
                                                          ],
                                                ]}
                                            >
                                                {/* Top Info Row inside the Connector Card */}
                                                <View style={styles.connectorInfoRow}>
                                                    <ConnectorBadge
                                                        type={connector.type}
                                                        isSelected={isSelected}
                                                        isDark={isDark}
                                                        compact={isSelected}
                                                    />

                                                    <View style={styles.powerGroup}>
                                                        <View
                                                            style={[
                                                                styles.acDcBadge,
                                                                currentType === 'DC'
                                                                    ? {
                                                                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7',
                                                                          borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#86EFAC',
                                                                      }
                                                                    : {
                                                                          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#E0F2FE',
                                                                          borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#7DD3FC',
                                                                      },
                                                            ]}
                                                        >
                                                            <ThemedText
                                                                style={[
                                                                    styles.acDcBadgeText,
                                                                    {
                                                                        color: currentType === 'DC'
                                                                            ? (isDark ? '#34D399' : '#15803D')
                                                                            : (isDark ? '#38BDF8' : '#0369A1'),
                                                                    },
                                                                ]}
                                                            >
                                                                {currentType}
                                                            </ThemedText>
                                                        </View>
                                                        <ThemedText style={[styles.powerText, { color: colors.text }]}>
                                                            {connector.power} kW
                                                        </ThemedText>
                                                    </View>

                                                    <ThemedText style={[styles.tariffPrice, { color: colors.text }]}>
                                                        ₹{connector.pricePerKWh.toFixed(0)}
                                                        <ThemedText style={[styles.tariffUnit, { color: colors.textMuted }]}>
                                                            /kWh
                                                        </ThemedText>
                                                    </ThemedText>

                                                    <View style={styles.statusColumn}>
                                                        <ThemedText
                                                            style={[
                                                                styles.statusText,
                                                                {
                                                                    color: isAvailable
                                                                        ? (isDark ? '#34D399' : '#15803D')
                                                                        : isPreparing
                                                                        ? '#D97706'
                                                                        : colors.textMuted,
                                                                },
                                                            ]}
                                                        >
                                                            {connector.status}
                                                        </ThemedText>
                                                    </View>
                                                </View>

                                                {/* Action Buttons INSIDE the same Selected Card */}
                                                {isSelected && (
                                                    <View style={styles.connectorActionsRow}>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.smartCutoffButton,
                                                                {
                                                                    backgroundColor: isDark ? '#22232D' : '#FFFFFF',
                                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                                                                },
                                                            ]}
                                                            onPress={() => {
                                                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                                setSmartCutoffModal(true);
                                                            }}
                                                            activeOpacity={0.82}
                                                        >
                                                            <ThemedText style={[styles.smartCutoffText, { color: colors.text }]}>
                                                                Smart Cut-off
                                                            </ThemedText>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={[
                                                                styles.startChargingButton,
                                                                {
                                                                    backgroundColor: colors.coral,
                                                                },
                                                            ]}
                                                            onPress={() => {
                                                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                                                handleStartCharging(connector);
                                                            }}
                                                            activeOpacity={0.82}
                                                        >
                                                            <Zap size={15} color="#FFFFFF" fill="#FFFFFF" />
                                                            <ThemedText style={[styles.startChargingText, { color: '#FFFFFF' }]}>
                                                                START CHARGING
                                                            </ThemedText>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* ── View full tariff and penalty schedule Link ── */}
                <TouchableOpacity
                    style={[
                        styles.tariffScheduleLinkRow,
                        {
                            backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                    onPress={() => {
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowTariffModal(true);
                    }}
                    activeOpacity={0.82}
                >
                    <ThemedText style={[styles.tariffScheduleLinkText, { color: colors.text }]}>
                        View full tariff and penalty schedule
                    </ThemedText>
                    <View style={[styles.chevronCircle, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}>
                        <ChevronRight size={13} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={3} />
                    </View>
                </TouchableOpacity>

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* ── Bottom Floating Bar (Help Support | Get Direction | Wallet Pill) ── */}
            <View
                style={[
                    styles.bottomBarWrap,
                    {
                        backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
                        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        borderTopWidth: 1.5,
                        paddingBottom: Math.max(insets.bottom, 12),
                    },
                ]}
            >
                {/* 2-CTA Row */}
                <View style={styles.bottomCtaRow}>
                    <TouchableOpacity
                        style={[
                            styles.helpSupportBtn,
                            {
                                backgroundColor: isDark ? '#1C1D26' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleHelpSupport();
                        }}
                        activeOpacity={0.82}
                    >
                        <PhoneCall size={17} color={colors.text} strokeWidth={2.2} />
                        <ThemedText style={[styles.helpSupportText, { color: colors.text }]}>
                            Help Support
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.getDirectionBtn,
                            {
                                backgroundColor: colors.coral,
                            },
                        ]}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            handleGetDirections();
                        }}
                        activeOpacity={0.82}
                    >
                        <Navigation size={17} color="#FFFFFF" fill="#FFFFFF" />
                        <ThemedText style={[styles.getDirectionText, { color: '#FFFFFF' }]}>
                            Get Direction
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Available Wallet Balance Strip */}
                <View
                    style={[
                        styles.walletStrip,
                        {
                            backgroundColor: isDark ? '#16171E' : '#F6F6F8',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                >
                    <View style={styles.walletLeft}>
                        <View style={[styles.walletGreenIcon, { backgroundColor: isDark ? '#22232D' : '#E5E7EB' }]}>
                            <Wallet size={15} color={colors.coral} strokeWidth={2} />
                        </View>
                        <ThemedText style={[styles.walletLabel, { color: colors.textMuted }]}>
                            Available <ThemedText style={[styles.walletLabelBold, { color: colors.text }]}>wallet</ThemedText> balance is{' '}
                            <ThemedText style={[styles.walletAmount, { color: colors.text }]}>₹ {user.walletBalance.toFixed(2)}</ThemedText>
                        </ThemedText>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.addWalletBtn,
                            {
                                backgroundColor: colors.coral,
                            },
                        ]}
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            topUpWallet(500);
                            Alert.alert('Wallet Recharged', '₹500 added to your Iris EV Wallet.');
                        }}
                        activeOpacity={0.82}
                    >
                        <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                        <ThemedText style={[styles.addWalletText, { color: '#FFFFFF' }]}>
                            Add
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Full Tariff Modal ── */}
            <Modal
                visible={showTariffModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTariffModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalSheet,
                            {
                                backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                    >
                        <View style={[styles.modalHandle, { backgroundColor: isDark ? '#33333C' : '#D1D5DB' }]} />
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                                Tariff & Penalty Schedule
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => setShowTariffModal(false)}
                                style={styles.modalClose}
                            >
                                <X size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={[styles.modalSub, { color: colors.textMuted }]}>
                            {station.name}
                        </ThemedText>

                        <View
                            style={[
                                styles.modalTariffBox,
                                {
                                    backgroundColor: isDark ? '#1C1D26' : '#F6F6F8',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                },
                            ]}
                        >
                            <View style={styles.tariffLine}>
                                <ThemedText style={[styles.tariffKey, { color: colors.textMuted }]}>Base Energy Tariff</ThemedText>
                                <ThemedText style={[styles.tariffVal, { color: colors.text }]}>₹10.00 / kWh</ThemedText>
                            </View>
                            <View style={styles.tariffLine}>
                                <ThemedText style={[styles.tariffKey, { color: colors.textMuted }]}>GST on Energy</ThemedText>
                                <ThemedText style={[styles.tariffVal, { color: colors.text }]}>18% (Included)</ThemedText>
                            </View>
                            <View style={styles.tariffLine}>
                                <ThemedText style={[styles.tariffKey, { color: colors.textMuted }]}>Idle Fee Grace Period</ThemedText>
                                <ThemedText style={[styles.tariffVal, { color: colors.text }]}>15 Minutes Free</ThemedText>
                            </View>
                            <View style={styles.tariffLine}>
                                <ThemedText style={[styles.tariffKey, { color: colors.textMuted }]}>Idle Penalty Rate</ThemedText>
                                <ThemedText style={[styles.tariffVal, { color: '#EF4444' }]}>
                                    ₹5.00 / min thereafter
                                </ThemedText>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.modalConfirmBtn,
                                {
                                    backgroundColor: colors.coral,
                                },
                            ]}
                            onPress={() => setShowTariffModal(false)}
                        >
                            <ThemedText
                                style={[
                                    styles.modalConfirmText,
                                    { color: '#FFFFFF' },
                                ]}
                            >
                                UNDERSTOOD
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Smart Cut-Off Modal ── */}
            <Modal
                visible={smartCutoffModal}
                transparent
                animationType="slide"
                onRequestClose={() => setSmartCutoffModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalSheet,
                            {
                                backgroundColor: isDark ? '#16171E' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                            },
                        ]}
                    >
                        <View style={[styles.modalHandle, { backgroundColor: isDark ? '#33333C' : '#D1D5DB' }]} />
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                                Smart Cut-Off Settings
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => setSmartCutoffModal(false)}
                                style={styles.modalClose}
                            >
                                <X size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={[styles.modalSub, { color: colors.textMuted }]}>
                            Auto-stop charging to prevent battery degradation and idle fees.
                        </ThemedText>

                        {['80% (Recommended for battery health)', '90% (Extended trip)', '100% (Full battery)'].map(
                            (option, i) => {
                                const isOptionActive = cutoffPercent.startsWith(option.slice(0, 3));
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[
                                            styles.cutoffOption,
                                            isOptionActive
                                                ? {
                                                      backgroundColor: isDark ? '#22232D' : '#FFFFFF',
                                                      borderColor: colors.coral,
                                                  }
                                                : {
                                                      backgroundColor: isDark ? '#16171E' : '#F6F6F8',
                                                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                                  },
                                        ]}
                                        onPress={() => {
                                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setCutoffPercent(option);
                                            setSmartCutoffModal(false);
                                        }}
                                        activeOpacity={0.82}
                                    >
                                        <ThemedText style={[styles.cutoffOptionText, { color: colors.text }]}>
                                            {option}
                                        </ThemedText>
                                        {isOptionActive && (
                                            <Check size={18} color={colors.coral} strokeWidth={2.5} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 160,
    },
    // Top Bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xs,
        paddingBottom: 4,
        gap: 10,
    },
    tactileCircleBtn: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    stationTitle: {
        fontSize: 18,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: -0.3,
        flex: 1,
    },
    topBarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    // Address
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginTop: 6,
        gap: 6,
    },
    addressText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        flex: 1,
    },
    // Pills
    pillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginTop: 12,
        gap: 8,
    },
    openPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    openPillText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.5,
    },
    grayPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        gap: 5,
    },
    grayPillText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    etaBold: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
    },
    // Amenities
    amenitiesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginTop: 12,
        gap: 8,
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    amenityText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    // Photo Gallery
    galleryScroll: {
        paddingHorizontal: SPACING.md,
        marginTop: 14,
        gap: 12,
    },
    galleryImageWrap: {
        width: 155,
        height: 130,
        borderRadius: RADIUS.squircle,
        overflow: 'hidden',
        borderWidth: 1,
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    // Charger Cards
    chargersSection: {
        paddingHorizontal: SPACING.md,
        marginTop: 18,
        gap: 14,
    },
    chargerCard: {
        borderRadius: RADIUS.cardLg,
        padding: 16,
        borderWidth: 1,
    },
    chargerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    chargerTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    chargerBoldLabel: {
        fontSize: 16,
        fontFamily: FONT_FAMILIES.bold,
    },
    chargerCode: {
        fontSize: 16,
        fontFamily: FONT_FAMILIES.medium,
    },
    trackStatusBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    trackStatusBtnText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
    },
    trackingBanner: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        marginBottom: 12,
    },
    trackingBannerText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    trackingTimerBold: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
    },
    connectorsStack: {
        gap: 10,
    },
    // Whole Connector Card
    connectorWholeCard: {
        borderRadius: RADIUS.card,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
    },
    connectorCardSelected: {
        borderWidth: 1.5,
    },
    connectorCardUnselected: {
        borderWidth: 1,
    },
    connectorInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    connectorIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        minWidth: 38,
    },
    connectorSublabel: {
        fontSize: 8.5,
        fontFamily: FONT_FAMILIES.sansBold,
        fontWeight: '700',
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    powerGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 10,
    },
    acDcBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: RADIUS.chip,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acDcBadgeText: {
        fontSize: 9,
        fontFamily: FONT_FAMILIES.bold,
        lineHeight: 12,
    },
    powerText: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.bold,
        minWidth: 50,
    },
    tariffPrice: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.extraBold,
    },
    tariffUnit: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    statusColumn: {
        marginLeft: 'auto',
    },
    statusText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
    },
    // Connector Action Buttons inside the Selected Card
    connectorActionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    smartCutoffButton: {
        flex: 1,
        borderRadius: RADIUS.pill,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    smartCutoffText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.5,
    },
    startChargingButton: {
        flex: 1.2,
        flexDirection: 'row',
        borderRadius: RADIUS.pill,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 0,
    },
    startChargingText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 0.6,
    },
    // Schedule Link
    tariffScheduleLinkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: SPACING.md,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: RADIUS.card,
        borderWidth: 1,
    },
    tariffScheduleLinkText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
    },
    chevronCircle: {
        width: 26,
        height: 26,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Bottom Bar
    bottomBarWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.md,
        paddingTop: 12,
    },
    bottomCtaRow: {
        flexDirection: 'row',
        gap: 10,
    },
    helpSupportBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.pill,
        height: 48,
        gap: 8,
        borderWidth: 1,
    },
    helpSupportText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.6,
    },
    getDirectionBtn: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.pill,
        height: 48,
        gap: 8,
        borderWidth: 0,
    },
    getDirectionText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.extraBold,
        letterSpacing: 0.6,
    },
    walletStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: RADIUS.pill,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginTop: 10,
        borderWidth: 1,
    },
    walletLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    walletGreenIcon: {
        width: 28,
        height: 28,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    walletLabel: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    walletLabelBold: {
        fontFamily: FONT_FAMILIES.bold,
    },
    walletAmount: {
        fontFamily: FONT_FAMILIES.bold,
    },
    addWalletBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.pill,
        paddingHorizontal: 14,
        paddingVertical: 6,
        gap: 4,
        borderWidth: 0,
    },
    addWalletText: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.bold,
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: RADIUS.bottomSheet,
        borderTopRightRadius: RADIUS.bottomSheet,
        borderTopWidth: 1,
        padding: SPACING.lg,
        paddingBottom: 36,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: RADIUS.pill,
        alignSelf: 'center',
        marginBottom: 14,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 17,
        fontFamily: FONT_FAMILIES.bold,
    },
    modalClose: {
        padding: 4,
    },
    modalSub: {
        fontSize: 12,
        fontFamily: FONT_FAMILIES.medium,
        marginTop: 4,
        marginBottom: 14,
    },
    modalTariffBox: {
        borderRadius: RADIUS.card,
        padding: 14,
        gap: 12,
        borderWidth: 1,
    },
    tariffLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tariffKey: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.medium,
    },
    tariffVal: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.bold,
    },
    modalConfirmBtn: {
        borderRadius: RADIUS.pill,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        borderWidth: 0,
    },
    modalConfirmText: {
        fontFamily: FONT_FAMILIES.bold,
        fontSize: 13,
        letterSpacing: 0.8,
    },
    cutoffOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: RADIUS.squircle,
        marginVertical: 4,
        borderWidth: 1,
    },
    cutoffOptionText: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.semiBold,
    },
});
