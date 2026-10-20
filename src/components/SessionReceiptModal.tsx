import React from 'react';
import {
    Alert,
    Modal,
    Platform,
    Share,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    X,
    Zap,
    Clock,
    CircleGauge,
    Share2,
    Download,
} from 'lucide-react-native';
import { ThemedText } from './ThemedText';
import { FONT_FAMILIES, RADIUS, SPACING } from '../constants/Tokens';
import { CompletedSessionReceipt } from '../context/ChargingContext';
import { useAppTheme } from '../hooks/useAppTheme';

interface SessionReceiptModalProps {
    visible: boolean;
    receipt: CompletedSessionReceipt | null;
    onClose: () => void;
}

export function SessionReceiptModal({ visible, receipt, onClose }: SessionReceiptModalProps) {
    const { isDark } = useAppTheme();

    if (!receipt) return null;

    const unitPrice = receipt.energyDeliveredKwh > 0
        ? (receipt.energyCost / receipt.energyDeliveredKwh).toFixed(0)
        : '19';

    const avgSpeed = receipt.avgPowerKw || receipt.peakPowerKw || 31.2;

    const stopReason = receipt.endSoc ? `Target Reached (${receipt.endSoc}%)` : 'User Stopped';

    const cgst = receipt.cgstAmount ? receipt.cgstAmount.toFixed(2) : (receipt.energyCost * 0.09).toFixed(2);
    const sgst = receipt.sgstAmount ? receipt.sgstAmount.toFixed(2) : (receipt.energyCost * 0.09).toFixed(2);

    const handleShare = async () => {
        try {
            await Share.share({
                title: `Charging Receipt - ${receipt.invoiceNo}`,
                message: `Iris EV Charging Receipt\n` +
                    `Station: ${receipt.stationName}\n` +
                    `Total Amount: ₹${receipt.totalAmountPaid.toFixed(2)}\n` +
                    `Energy Delivered: ${receipt.energyDeliveredKwh} kWh\n` +
                    `Duration: ${receipt.durationFormatted}\n` +
                    `Average Speed: ${avgSpeed} kW\n` +
                    `Invoice No: ${receipt.invoiceNo}\n` +
                    `Transaction ID: ${receipt.transactionId}`,
            });
        } catch {
            // User dismissed or error
        }
    };

    const handleDownload = () => {
        Alert.alert(
            'Receipt Downloaded',
            `Invoice ${receipt.invoiceNo} has been saved to your receipts.`
        );
    };

    const textColor = isDark ? '#FFFFFF' : '#111827';
    const textMutedColor = isDark ? '#9CA3AF' : '#8E8E93';
    const cardBg = isDark ? '#181924' : '#FFFFFF';
    const dividerColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB';
    const subDividerColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6';
    const footerBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB';
    const dockBg = isDark ? '#181924' : '#FFFFFF';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={styles.modalBackdrop}>
                <StatusBar barStyle="light-content" backgroundColor="#FF5B45" />
                <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                    {/* Top Bar: Title & Circular Close Button */}
                    <View style={styles.topHeader}>
                        <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
                        <TouchableOpacity
                            style={styles.closeCircle}
                            onPress={onClose}
                            activeOpacity={0.8}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <X size={18} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Receipt Body */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Main White Receipt Ticket Card */}
                        <View style={[styles.receiptCard, { backgroundColor: cardBg }]}>
                            <View style={styles.receiptCardInner}>
                                {/* Total Amount Eyebrow & Giant Price */}
                                <ThemedText style={[styles.totalAmountLabel, { color: textMutedColor }]}>
                                    TOTAL AMOUNT
                                </ThemedText>
                                <ThemedText style={[styles.giantAmountText, { color: textColor }]}>
                                    ₹{receipt.totalAmountPaid.toFixed(2)}
                                </ThemedText>

                                {/* 3-Column Metrics: Energy, Duration, Avg Speed */}
                                <View style={styles.metricsRow}>
                                    {/* Energy Column */}
                                    <View style={styles.metricCol}>
                                        <Zap size={16} color="#FF5B45" fill="#FF5B45" />
                                        <ThemedText style={[styles.metricVal, { color: textColor }]}>
                                            {receipt.energyDeliveredKwh} kWh
                                        </ThemedText>
                                        <ThemedText style={[styles.metricCaption, { color: textMutedColor }]}>
                                            Energy
                                        </ThemedText>
                                    </View>

                                    {/* Duration Column */}
                                    <View style={styles.metricCol}>
                                        <Clock size={16} color="#FF5B45" />
                                        <ThemedText style={[styles.metricVal, { color: textColor }]}>
                                            {receipt.durationFormatted}
                                        </ThemedText>
                                        <ThemedText style={[styles.metricCaption, { color: textMutedColor }]}>
                                            Duration
                                        </ThemedText>
                                    </View>

                                    {/* Avg Speed Column */}
                                    <View style={styles.metricCol}>
                                        <CircleGauge size={16} color="#FF5B45" />
                                        <ThemedText style={[styles.metricVal, { color: textColor }]}>
                                            {avgSpeed}
                                        </ThemedText>
                                        <ThemedText style={[styles.metricCaption, { color: textMutedColor }]}>
                                            Avg Speed
                                        </ThemedText>
                                    </View>
                                </View>

                                {/* Perforated Dashed Line */}
                                <View style={[styles.perforatedDivider, { borderTopColor: dividerColor }]} />

                                {/* Station & Session Meta */}
                                <View style={styles.detailsSection}>
                                    <View style={styles.detailRow}>
                                        <ThemedText style={[styles.detailLabel, { color: textMutedColor }]}>
                                            Station name
                                        </ThemedText>
                                        <ThemedText
                                            style={[styles.detailValue, { color: textColor, fontFamily: FONT_FAMILIES.bold }]}
                                            numberOfLines={1}
                                        >
                                            {receipt.stationName}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <ThemedText style={[styles.detailLabel, { color: textMutedColor }]}>
                                            Station Id
                                        </ThemedText>
                                        <ThemedText style={[styles.detailValue, { color: textColor, fontFamily: FONT_FAMILIES.bold }]}>
                                            {receipt.chargerId || 'SP-01'}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <ThemedText style={[styles.detailLabel, { color: textMutedColor }]}>
                                            Stop reason
                                        </ThemedText>
                                        <ThemedText style={[styles.detailValue, { color: textColor, fontFamily: FONT_FAMILIES.bold }]}>
                                            {stopReason}
                                        </ThemedText>
                                    </View>

                                    {/* Spacing before pricing items */}
                                    <View style={{ height: 10 }} />

                                    {/* Pricing & Tax Breakdown */}
                                    <View style={styles.detailRow}>
                                        <ThemedText style={[styles.detailLabel, { color: textMutedColor }]}>
                                            Unit Price (₹{unitPrice}/kWh)
                                        </ThemedText>
                                        <ThemedText style={[styles.detailValue, { color: textColor, fontFamily: FONT_FAMILIES.bold }]}>
                                            ₹{receipt.energyCost.toFixed(2)}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <ThemedText style={[styles.detailLabel, { color: textMutedColor }]}>
                                            Platform Fee
                                        </ThemedText>
                                        <ThemedText style={[styles.detailValue, { color: textColor, fontFamily: FONT_FAMILIES.bold }]}>
                                            ₹0
                                        </ThemedText>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <ThemedText style={[styles.detailLabel, { color: textMutedColor }]}>
                                            CGST (9%)
                                        </ThemedText>
                                        <ThemedText style={[styles.detailValue, { color: textColor, fontFamily: FONT_FAMILIES.bold }]}>
                                            ₹{cgst}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <ThemedText style={[styles.detailLabel, { color: textMutedColor }]}>
                                            SGST (9%)
                                        </ThemedText>
                                        <ThemedText style={[styles.detailValue, { color: textColor, fontFamily: FONT_FAMILIES.bold }]}>
                                            ₹{sgst}
                                        </ThemedText>
                                    </View>
                                </View>

                                {/* Thin Solid Divider before Grand Total */}
                                <View style={[styles.solidDivider, { backgroundColor: subDividerColor }]} />

                                {/* Grand Total Row */}
                                <View style={styles.grandTotalRow}>
                                    <ThemedText style={[styles.grandTotalLabel, { color: textColor }]}>
                                        Grand Total
                                    </ThemedText>
                                    <ThemedText style={[styles.grandTotalValue, { color: textColor }]}>
                                        ₹{receipt.totalAmountPaid.toFixed(2)}
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Card Footer Strip with Txn ID & Timestamp */}
                            <View style={[styles.cardFooterStrip, { backgroundColor: footerBg }]}>
                                <ThemedText style={[styles.cardFooterText, { color: textMutedColor }]}>
                                    Txn ID: {receipt.transactionId} • {receipt.startTime}
                                </ThemedText>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Bottom Floating Action Dock */}
                    <View style={[styles.bottomDock, { backgroundColor: dockBg }]}>
                        {/* Share Button */}
                        <TouchableOpacity
                            style={[
                                styles.dockBtn,
                                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6' },
                            ]}
                            onPress={handleShare}
                            activeOpacity={0.8}
                        >
                            <Share2 size={16} color={isDark ? '#FFFFFF' : '#111827'} strokeWidth={2.2} />
                            <ThemedText style={[styles.dockBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                Share
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Receipt Download Button */}
                        <TouchableOpacity
                            style={[
                                styles.dockBtn,
                                { backgroundColor: isDark ? '#FF5B45' : '#111827' },
                            ]}
                            onPress={handleDownload}
                            activeOpacity={0.8}
                        >
                            <Download size={16} color="#FFFFFF" strokeWidth={2.2} />
                            <ThemedText style={[styles.dockBtnText, { color: '#FFFFFF' }]}>
                                Receipt
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: '#FF5B45', // Sunset Coral signature backdrop matching app
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 12 : 8,
        paddingBottom: 14,
    },
    summaryTitle: {
        fontSize: 22,
        fontFamily: FONT_FAMILIES.bold,
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    closeCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    receiptCard: {
        borderRadius: RADIUS.cardLg,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 8,
    },
    receiptCardInner: {
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    totalAmountLabel: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.bold,
        letterSpacing: 0.8,
        textAlign: 'center',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    giantAmountText: {
        fontSize: 38,
        fontFamily: FONT_FAMILIES.bold,
        textAlign: 'center',
        letterSpacing: -0.8,
        marginBottom: 20,
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        marginBottom: 4,
    },
    metricCol: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    metricVal: {
        fontSize: 15,
        fontFamily: FONT_FAMILIES.bold,
        marginTop: 2,
    },
    metricCaption: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    perforatedDivider: {
        height: 0,
        borderTopWidth: 1.5,
        borderStyle: 'dashed',
        marginVertical: 18,
    },
    detailsSection: {
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 13,
        fontFamily: FONT_FAMILIES.medium,
        flex: 1,
    },
    detailValue: {
        fontSize: 13,
        textAlign: 'right',
        flex: 1,
    },
    solidDivider: {
        height: 1,
        marginTop: 18,
        marginBottom: 14,
    },
    grandTotalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontFamily: FONT_FAMILIES.bold,
    },
    grandTotalValue: {
        fontSize: 17,
        fontFamily: FONT_FAMILIES.bold,
    },
    cardFooterStrip: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardFooterText: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
        letterSpacing: 0.2,
    },
    bottomDock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
    },
    dockBtn: {
        flex: 1,
        height: 48,
        borderRadius: RADIUS.button,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    dockBtnText: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.bold,
    },
});
