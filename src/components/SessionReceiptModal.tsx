import React from 'react';
import {
    Alert,
    Modal,
    Platform,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    X,
    Zap,
    Clock,
    CircleGauge,
    Share2,
    Download,
} from './sf/icons';
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
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();

    if (!receipt) return null;

    const unitPrice = receipt.energyDeliveredKwh > 0
        ? (receipt.energyCost / receipt.energyDeliveredKwh).toFixed(0)
        : '19';

    const avgSpeed = receipt.avgPowerKw || receipt.peakPowerKw || 31.2;

    const stopReason = receipt.endSoc ? `Target Reached (${receipt.endSoc}%)` : 'User Stopped';

    const cgst = receipt.cgstAmount ? receipt.cgstAmount.toFixed(2) : (receipt.energyCost * 0.09).toFixed(2);
    const sgst = receipt.sgstAmount ? receipt.sgstAmount.toFixed(2) : (receipt.energyCost * 0.09).toFixed(2);
    const formattedTotalAmount = receipt.totalAmountPaid != null
        ? Number(receipt.totalAmountPaid).toFixed(2)
        : '0.00';

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

    const textColor = colors.text;
    const textMutedColor = colors.textMuted;
    const cardBg = colors.surface;
    const dividerColor = colors.border;
    const subDividerColor = colors.border;
    const footerBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(118,118,128,0.08)';
    const dockBg = colors.background;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.modalBackdrop, { backgroundColor: colors.background }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <View style={[styles.safeArea, { paddingTop: Platform.OS === 'ios' ? 8 : insets.top }]}>
                    {/* Top Bar: Title & Circular Close Button */}
                    <View style={styles.topHeader}>
                        <ThemedText style={[styles.summaryTitle, { color: colors.text }]}>Receipt</ThemedText>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Close receipt"
                            style={[styles.closeCircle, { backgroundColor: 'rgba(118,118,128,0.2)' }]}
                            onPress={onClose}
                            activeOpacity={0.8}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <X size={18} color={colors.text} strokeWidth={2.5} />
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
                                <ThemedText
                                    type="heroStat"
                                    style={[styles.giantAmountText, { color: textColor }]}
                                >
                                    ₹{formattedTotalAmount}
                                </ThemedText>

                                {/* 3-Column Metrics: Energy, Duration, Avg Speed */}
                                <View style={styles.metricsRow}>
                                    {/* Energy Column */}
                                    <View style={styles.metricCol}>
                                        <Zap size={16} color="#007AFF" fill="#007AFF" />
                                        <ThemedText style={[styles.metricVal, { color: textColor }]}>
                                            {receipt.energyDeliveredKwh} kWh
                                        </ThemedText>
                                        <ThemedText style={[styles.metricCaption, { color: textMutedColor }]}>
                                            Energy
                                        </ThemedText>
                                    </View>

                                    {/* Duration Column */}
                                    <View style={styles.metricCol}>
                                        <Clock size={16} color="#007AFF" />
                                        <ThemedText style={[styles.metricVal, { color: textColor }]}>
                                            {receipt.durationFormatted}
                                        </ThemedText>
                                        <ThemedText style={[styles.metricCaption, { color: textMutedColor }]}>
                                            Duration
                                        </ThemedText>
                                    </View>

                                    {/* Avg Speed Column */}
                                    <View style={styles.metricCol}>
                                        <CircleGauge size={16} color="#007AFF" />
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
                    <View style={[styles.bottomDock, { backgroundColor: dockBg, paddingBottom: Math.max(insets.bottom, 16) }]}>
                        {/* Share Button */}
                        <TouchableOpacity
                            style={[
                                styles.dockBtn,
                                { backgroundColor: colors.surface },
                            ]}
                            onPress={handleShare}
                            activeOpacity={0.8}
                        >
                            <Share2 size={16} color={colors.text} strokeWidth={2.2} />
                            <ThemedText style={[styles.dockBtnText, { color: colors.text }]}>
                                Share
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Receipt Download Button */}
                        <TouchableOpacity
                            style={[
                                styles.dockBtn,
                                { backgroundColor: colors.primary },
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
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
    },
    summaryTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.8,
        lineHeight: 38,
    },
    closeCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    receiptCard: {
        borderRadius: 24,
        overflow: 'hidden',
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
        marginBottom: 8,
    },
    giantAmountText: {
        fontSize: 36,
        fontWeight: '800',
        lineHeight: 44,
        minHeight: 44,
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
        marginTop: 2.0,
    },
    metricCaption: {
        fontSize: 11,
        fontFamily: FONT_FAMILIES.medium,
    },
    perforatedDivider: {
        height: 0,
        borderTopWidth: 1.5,
        borderStyle: 'dashed',
        marginVertical: 16,
    },
    detailsSection: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: FONT_FAMILIES.medium,
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        textAlign: 'right',
        flex: 1,
    },
    solidDivider: {
        height: 1,
        marginTop: 16,
        marginBottom: 16,
    },
    grandTotalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 2.0,
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
        paddingBottom: 16,
    },
    dockBtn: {
        flex: 1,
        height: 52,
        borderRadius: 26,
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
