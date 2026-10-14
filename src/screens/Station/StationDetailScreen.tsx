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
import { FONT_FAMILIES, RADIUS, SHADOWS, SPACING } from '../../constants/Tokens';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVehicles } from '../../context/VehicleContext';

// Helper to render connector icon with type badge
function ConnectorBadge({
    type,
    isGreen = true,
    compact = false,
}: {
    type: Connector['type'];
    isGreen?: boolean;
    compact?: boolean;
}) {
    const iconColor = isGreen ? '#FFFFFF' : '#737373';
    const iconSize = compact ? 24 : 28;
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
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { user, topUpWallet } = useVehicles();

    const routeStation = route.params?.stationSnapshot as Station | undefined;
    const station: Station =
        routeStation ??
        getStationById(route.params?.stationId) ??
        MOCK_STATIONS.find((item) => item.id === route.params?.stationId) ??
        MOCK_STATIONS[0];

    const [isFavorite, setIsFavorite] = useState(false);
    const [showTariffModal, setShowTariffModal] = useState(false);
    const [smartCutoffModal, setSmartCutoffModal] = useState(false);
    const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(
        station.connectors[0]?.id ?? null
    );
    const [cutoffPercent, setCutoffPercent] = useState('80%');

    // Track Charger Status state per charger group (default first charger tracked as in screenshot)
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
            displayId: 'CP1233', // Matches screenshot label or actual chargerId
            chargerId,
            connectors,
        }));
    }, [station.connectors]);

    const handleShare = async () => {
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
                text: '📞 Call 1800-419-IRIS',
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
        <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAF9' }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Top App Bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>

                    <ThemedText style={styles.stationTitle} numberOfLines={1}>
                        {station.name}
                    </ThemedText>

                    <View style={styles.topBarActions}>
                        <TouchableOpacity
                            onPress={() => setIsFavorite(!isFavorite)}
                            style={styles.actionIconBtn}
                            activeOpacity={0.7}
                        >
                            <Heart
                                size={23}
                                color={colors.text}
                                fill={isFavorite ? colors.text : 'none'}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleShare}
                            style={styles.actionIconBtn}
                            activeOpacity={0.7}
                        >
                            <Share2 size={22} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Subtitle / Address ── */}
                <View style={styles.addressRow}>
                    <MapPin size={13} color="#9CA3AF" style={{ marginTop: 1 }} />
                    <ThemedText style={styles.addressText} numberOfLines={1}>
                        {station.address}
                    </ThemedText>
                </View>

                {/* ── Meta Pills (Open | Timing | Kms & ETA) ── */}
                <View style={styles.pillsRow}>
                    <View style={styles.openPill}>
                        <ThemedText style={styles.openPillText}>Open</ThemedText>
                    </View>

                    <View style={styles.grayPill}>
                        <Clock size={12} color="#374151" />
                        <ThemedText style={styles.grayPillText}>
                            {station.openTime} - {station.closeTime}
                        </ThemedText>
                    </View>

                    <View style={styles.grayPill}>
                        <Navigation size={12} color="#374151" />
                        <ThemedText style={styles.grayPillText}>
                            {station.distanceKm} Kms | <ThemedText style={styles.etaBold}>ETA:</ThemedText> {station.etaMinutes} Mins
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
                            <View key={index} style={styles.amenityItem}>
                                <IconComp size={14} color="#9CA3AF" />
                                <ThemedText style={styles.amenityText}>{item}</ThemedText>
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
                        <Image
                            key={idx}
                            source={{ uri: imgUri }}
                            style={styles.galleryImage}
                            resizeMode="cover"
                        />
                    ))}
                </ScrollView>

                {/* ── Charger Cards Section ── */}
                <View style={styles.chargersSection}>
                    {chargerGroups.map((group) => {
                        const trackingSecs = trackedChargers[group.chargerId];
                        const isTracking = Boolean(trackingSecs && trackingSecs > 0);

                        return (
                            <View key={group.groupKey} style={styles.chargerCard}>
                                {/* Card Header */}
                                <View style={styles.chargerHeader}>
                                    <View style={styles.chargerTitleGroup}>
                                        <ThemedText style={styles.chargerBoldLabel}>Charger</ThemedText>
                                        <ThemedText style={styles.chargerCode}>{group.chargerId}</ThemedText>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => toggleTrackCharger(group.chargerId)}
                                        activeOpacity={0.7}
                                    >
                                        <ThemedText
                                            style={
                                                isTracking
                                                    ? styles.stopTrackStatusLink
                                                    : styles.trackStatusLink
                                            }
                                        >
                                            {isTracking
                                                ? 'Stop tracking charger status'
                                                : 'Track Charger Status'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>

                                {/* Availability Tracking Countdown Banner */}
                                {isTracking && (
                                    <View style={styles.trackingBanner}>
                                        <ThemedText style={styles.trackingBannerText}>
                                            Your availability tracking ends in{' '}
                                            <ThemedText style={styles.trackingTimerBold}>
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
                                                activeOpacity={0.85}
                                                onPress={() => {
                                                    if (Platform.OS !== 'web') {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                    }
                                                    setSelectedConnectorId(connector.id);
                                                }}
                                                style={[
                                                    styles.connectorWholeCard,
                                                    isSelected
                                                        ? styles.connectorCardSelected
                                                        : styles.connectorCardUnselected,
                                                ]}
                                            >
                                                {/* Top Info Row inside the Connector Card */}
                                                <View style={styles.connectorInfoRow}>
                                                    <ConnectorBadge
                                                        type={connector.type}
                                                        isGreen={isAvailable || isPreparing}
                                                        compact={isSelected}
                                                    />

                                                    <View style={styles.powerGroup}>
                                                        <View
                                                            style={[
                                                                styles.acDcBadge,
                                                                currentType === 'DC'
                                                                    ? styles.dcBadge
                                                                    : styles.acBadge,
                                                            ]}
                                                        >
                                                            <ThemedText
                                                                style={[
                                                                    styles.acDcBadgeText,
                                                                    currentType === 'DC'
                                                                        ? styles.dcBadgeText
                                                                        : styles.acBadgeText,
                                                                ]}
                                                            >
                                                                {currentType}
                                                            </ThemedText>
                                                        </View>
                                                        <ThemedText
                                                            style={[
                                                                styles.powerText,
                                                                isSelected && styles.powerTextSelected,
                                                            ]}
                                                        >
                                                            {connector.power} kW
                                                        </ThemedText>
                                                    </View>

                                                    <ThemedText
                                                        style={[
                                                            styles.tariffPrice,
                                                            isSelected && styles.tariffPriceSelected,
                                                        ]}
                                                    >
                                                        ₹{connector.pricePerKWh.toFixed(0)}
                                                        <ThemedText style={styles.tariffUnit}>/kWh</ThemedText>
                                                    </ThemedText>

                                                    <View style={styles.statusColumn}>
                                                        <ThemedText
                                                            style={[
                                                                styles.statusText,
                                                                isPreparing
                                                                    ? styles.statusPreparing
                                                                    : styles.statusAvailable,
                                                            ]}
                                                        >
                                                            {connector.status}
                                                        </ThemedText>
                                                    </View>
                                                </View>

                                                {/* Action Buttons INSIDE the same Green Bordered Card when selected */}
                                                {isSelected && (
                                                    <View style={styles.connectorActionsRow}>
                                                        <TouchableOpacity
                                                            style={styles.smartCutoffButton}
                                                            onPress={() => setSmartCutoffModal(true)}
                                                            activeOpacity={0.8}
                                                        >
                                                            <ThemedText style={styles.smartCutoffText}>
                                                                Smart Cut-off
                                                            </ThemedText>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={styles.startChargingButton}
                                                            onPress={() => handleStartCharging(connector)}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Zap size={16} color="#FFFFFF" fill="#FFFFFF" />
                                                            <ThemedText style={styles.startChargingText}>
                                                                Start Charging
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
                    style={styles.tariffScheduleLinkRow}
                    onPress={() => setShowTariffModal(true)}
                    activeOpacity={0.7}
                >
                    <ThemedText style={styles.tariffScheduleLinkText}>
                        View full tariff and penalty schedule
                    </ThemedText>
                    <View style={styles.chevronCircle}>
                        <ChevronRight size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* ── Bottom Floating Bar (Help Support | Get Direction | Wallet Pill) ── */}
            <View
                style={[
                    styles.bottomBarWrap,
                    {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.cardBorder,
                        borderTopWidth: 1,
                        paddingBottom: Math.max(insets.bottom, 12),
                    },
                ]}
            >
                {/* 2-CTA Row */}
                <View style={styles.bottomCtaRow}>
                    <TouchableOpacity
                        style={styles.helpSupportBtn}
                        onPress={handleHelpSupport}
                        activeOpacity={0.8}
                    >
                        <PhoneCall size={17} color={colors.text} />
                        <ThemedText style={styles.helpSupportText}>Help Support</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.getDirectionBtn}
                        onPress={handleGetDirections}
                        activeOpacity={0.8}
                    >
                        <Navigation size={17} color="#000000" fill="#000000" />
                        <ThemedText style={styles.getDirectionText}>Get Direction</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Available Wallet Balance Strip */}
                <View style={styles.walletStrip}>
                    <View style={styles.walletLeft}>
                        <View style={styles.walletGreenIcon}>
                            <Wallet size={17} color="#000000" />
                        </View>
                        <ThemedText style={styles.walletLabel}>
                            Available <ThemedText style={styles.walletLabelBold}>wallet</ThemedText> balance is{' '}
                            <ThemedText style={styles.walletAmount}>₹ {user.walletBalance.toFixed(2)}</ThemedText>
                        </ThemedText>
                    </View>

                    <TouchableOpacity
                        style={styles.addWalletBtn}
                        onPress={() => {
                            topUpWallet(500);
                            Alert.alert('Wallet Recharged', '₹500 added to your Iris EV Wallet.');
                        }}
                        activeOpacity={0.8}
                    >
                        <Plus size={15} color={colors.text} strokeWidth={2.5} />
                        <ThemedText style={styles.addWalletText}>Add</ThemedText>
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
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Tariff & Penalty Schedule</ThemedText>
                            <TouchableOpacity
                                onPress={() => setShowTariffModal(false)}
                                style={styles.modalClose}
                            >
                                <X size={18} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={styles.modalSub}>{station.name}</ThemedText>

                        <View style={styles.modalTariffBox}>
                            <View style={styles.tariffLine}>
                                <ThemedText style={styles.tariffKey}>Base Energy Tariff</ThemedText>
                                <ThemedText style={styles.tariffVal}>₹10.00 / kWh</ThemedText>
                            </View>
                            <View style={styles.tariffLine}>
                                <ThemedText style={styles.tariffKey}>GST on Energy</ThemedText>
                                <ThemedText style={styles.tariffVal}>18% (Included)</ThemedText>
                            </View>
                            <View style={styles.tariffLine}>
                                <ThemedText style={styles.tariffKey}>Idle Fee Grace Period</ThemedText>
                                <ThemedText style={styles.tariffVal}>15 Minutes Free</ThemedText>
                            </View>
                            <View style={styles.tariffLine}>
                                <ThemedText style={styles.tariffKey}>Idle Penalty Rate</ThemedText>
                                <ThemedText style={[styles.tariffVal, { color: '#EF4444' }]}>
                                    ₹5.00 / min thereafter
                                </ThemedText>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.modalConfirmBtn}
                            onPress={() => setShowTariffModal(false)}
                        >
                            <ThemedText style={styles.modalConfirmText}>Understood</ThemedText>
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
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Smart Cut-Off Settings</ThemedText>
                            <TouchableOpacity
                                onPress={() => setSmartCutoffModal(false)}
                                style={styles.modalClose}
                            >
                                <X size={18} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={styles.modalSub}>
                            Auto-stop charging to prevent battery degradation and idle fees.
                        </ThemedText>

                        {['80% (Recommended for battery health)', '90% (Extended trip)', '100% (Full battery)'].map(
                            (option, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.cutoffOption,
                                        cutoffPercent.startsWith(option.slice(0, 3)) &&
                                            styles.cutoffOptionActive,
                                    ]}
                                    onPress={() => {
                                        setCutoffPercent(option);
                                        setSmartCutoffModal(false);
                                    }}
                                >
                                    <ThemedText style={styles.cutoffOptionText}>{option}</ThemedText>
                                </TouchableOpacity>
                            )
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
        paddingBottom: 145,
    },
    // Top Bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xs,
        paddingBottom: 4,
    },
    backButton: {
        paddingRight: 4,
        marginLeft: -4,
    },
    stationTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILIES.serifHeading,
        flexShrink: 1,
        textShadowColor: '#000000',
        textShadowOffset: { width: 1.5, height: 1.5 },
        textShadowRadius: 0,
    },
    topBarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        gap: 14,
    },
    actionIconBtn: {
        padding: 2,
    },
    // Address
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginTop: 4,
        gap: 4,
    },
    addressText: {
        fontSize: 12,
        color: '#9CA3AF',
        flex: 1,
    },
    // Pills
    pillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginTop: 10,
        gap: 8,
    },
    openPill: {
        backgroundColor: '#E8F7EC',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
    },
    openPillText: {
        fontSize: 12,
        fontWeight: '700',
        fontFamily: FONT_FAMILIES.sansBold,
        color: '#FFFFFF',
    },
    grayPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAECEF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        gap: 5,
    },
    grayPillText: {
        fontSize: 11,
        fontWeight: '500',
        fontFamily: FONT_FAMILIES.sansMedium,
        color: '#374151',
    },
    etaBold: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: FONT_FAMILIES.sansBold,
        color: '#111827',
    },
    // Amenities
    amenitiesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginTop: 10,
        gap: 14,
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    amenityText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    // Photo Gallery
    galleryScroll: {
        paddingHorizontal: SPACING.md,
        marginTop: 14,
        gap: 12,
    },
    galleryImage: {
        width: 155,
        height: 130,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
    },
    // Charger Cards
    chargersSection: {
        paddingHorizontal: SPACING.md,
        marginTop: 16,
        gap: 14,
    },
    chargerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
    },
    chargerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    chargerTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    chargerBoldLabel: {
        fontSize: 16,
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
        color: '#111827',
    },
    chargerCode: {
        fontSize: 16,
        fontWeight: '400',
        color: '#111827',
    },
    trackStatusLink: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: FONT_FAMILIES.sansSemiBold,
        color: '#FFFFFF',
        textDecorationLine: 'underline',
    },
    stopTrackStatusLink: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: FONT_FAMILIES.sansSemiBold,
        color: '#DC2626',
        textDecorationLine: 'underline',
    },
    trackingBanner: {
        alignItems: 'center',
        marginBottom: 10,
    },
    trackingBannerText: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    trackingTimerBold: {
        fontSize: 13,
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
        color: '#FFFFFF',
    },
    connectorsStack: {
        gap: 10,
    },
    // Whole Connector Card (Selected wraps both info row + buttons!)
    connectorWholeCard: {
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 8,
        borderWidth: 1.5,
    },
    connectorCardSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
        borderBottomWidth: 2,
        borderBottomColor: '#B0B0B8',
        transform: [{ translateY: 2 }],
    },
    connectorCardUnselected: {
        backgroundColor: '#121216',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderBottomWidth: 3.5,
        borderBottomColor: '#070709',
    },
    connectorInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    connectorIconContainer: {
        alignItems: 'center',
        width: 42,
        marginRight: 8,
    },
    connectorSublabel: {
        fontSize: 8,
        fontWeight: '700',
        fontFamily: FONT_FAMILIES.sansBold,
        marginTop: 2,
    },
    powerGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 10,
    },
    acDcBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dcBadge: {
        backgroundColor: '#E8F7EC',
    },
    acBadge: {
        backgroundColor: '#E0F2FE',
    },
    acDcBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
        lineHeight: 14,
    },
    dcBadgeText: {
        color: '#000000',
    },
    acBadgeText: {
        color: '#0284C7',
    },
    powerText: {
        fontSize: 15,
        fontWeight: '500',
        fontFamily: FONT_FAMILIES.sansMedium,
        color: '#1E293B',
        minWidth: 50,
    },
    powerTextSelected: {
        fontSize: 13,
        color: '#000000',
    },
    tariffPrice: {
        fontSize: 15,
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
        color: '#0F172A',
    },
    tariffPriceSelected: {
        fontSize: 13,
        color: '#000000',
    },
    tariffUnit: {
        fontSize: 12,
        fontWeight: '400',
        fontFamily: FONT_FAMILIES.sansRegular,
        color: '#475569',
    },
    statusColumn: {
        marginLeft: 'auto',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: FONT_FAMILIES.sansBold,
    },
    statusPreparing: {
        color: '#D97706',
        fontWeight: '700',
        fontFamily: FONT_FAMILIES.sansBold,
    },
    statusAvailable: {
        color: '#000000',
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
    },
    // Connector Action Buttons inside the Selected Card
    connectorActionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    smartCutoffButton: {
        flex: 1,
        backgroundColor: '#1E1E24',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderBottomWidth: 3.5,
        borderBottomColor: '#070709',
    },
    smartCutoffText: {
        fontSize: 13,
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    startChargingButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderColor: '#000000',
        borderBottomWidth: 3.5,
        borderBottomColor: '#333338',
    },
    startChargingText: {
        fontSize: 13,
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    // Schedule Link
    tariffScheduleLinkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        marginTop: 16,
        gap: 8,
    },
    tariffScheduleLinkText: {
        fontSize: 13,
        fontWeight: '700',
        fontFamily: FONT_FAMILIES.sansBold,
        color: '#FFFFFF',
    },
    chevronCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Bottom Bar
    bottomBarWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: SPACING.md,
        paddingTop: 12,
    },
    bottomCtaRow: {
        flexDirection: 'row',
        gap: 12,
    },
    helpSupportBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16161B',
        borderRadius: 12,
        height: 48,
        gap: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderBottomWidth: 4,
        borderBottomColor: '#070709',
    },
    helpSupportText: {
        fontSize: 13,
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        textShadowColor: '#000000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    getDirectionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 48,
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#000000',
        borderBottomWidth: 4,
        borderBottomColor: '#333338',
    },
    getDirectionText: {
        fontSize: 13,
        fontWeight: '800',
        fontFamily: FONT_FAMILIES.sansExtraBold,
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    walletStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#141418',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 10,
    },
    walletLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    walletGreenIcon: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    walletLabel: {
        fontSize: 12,
        color: '#8E8E93',
    },
    walletLabelBold: {
        fontWeight: '700',
        fontFamily: FONT_FAMILIES.sansBold,
        color: '#FFFFFF',
    },
    walletAmount: {
        fontWeight: '700',
        fontFamily: FONT_FAMILIES.sansBold,
        color: '#FFFFFF',
    },
    addWalletBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 3,
    },
    addWalletText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: FONT_FAMILIES.sansSemiBold,
        color: '#FFFFFF',
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.lg,
        paddingBottom: 36,
    },
    modalHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    modalClose: {
        padding: 4,
    },
    modalSub: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        marginBottom: 14,
    },
    modalTariffBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        gap: 10,
    },
    tariffLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tariffKey: {
        fontSize: 13,
        color: '#4B5563',
    },
    tariffVal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    modalConfirmBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    modalConfirmText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 14,
    },
    cutoffOption: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },
    cutoffOptionActive: {
        backgroundColor: '#DCFCE7',
    },
    cutoffOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
});
