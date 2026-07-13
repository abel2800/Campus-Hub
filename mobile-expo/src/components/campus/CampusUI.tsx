import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ViewStyle,
  TextStyle,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, Gradients } from '../../theme/colors';

/* ─── Glass panel ─── */
export function Glass({
  children,
  style,
  onPress,
  padding = 12,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
}) {
  const inner = (
    <View style={[styles.glass, { padding }, style]}>{children}</View>
  );
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

/* ─── Gradient CTA button ─── */
export function GradButton({
  label,
  onPress,
  style,
  compact,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={style}>
      <LinearGradient
        colors={[...Gradients.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradBtn, compact && styles.gradBtnCompact]}
      >
        <Text style={styles.gradBtnText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/* ─── Chip ─── */
export function Chip({
  label,
  icon,
  selected,
  accent,
  glass,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  accent?: boolean;
  glass?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.chipRow}>
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={accent ? C.g1a : icon === 'flame' ? C.g2a : C.g1a}
          style={{ marginRight: 5 }}
        />
      )}
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          accent && styles.chipTextAccent,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (selected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <LinearGradient colors={[...Gradients.primary]} style={styles.chip}>
          <Text style={[styles.chipText, styles.chipTextSelected]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const chipStyle = [
    styles.chip,
    glass && styles.chipGlass,
    accent && styles.chipAccent,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={chipStyle} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={chipStyle}>{content}</View>;
}

/* ─── Search bar ─── */
export function SearchBar({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value?: string;
  onChangeText?: (t: string) => void;
}) {
  return (
    <Glass padding={10} style={styles.searchWrap}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={15} color={C.textMute} />
        {onChangeText ? (
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={C.textMute}
            value={value}
            onChangeText={onChangeText}
          />
        ) : (
          <Text style={styles.searchPlaceholder}>{placeholder}</Text>
        )}
      </View>
    </Glass>
  );
}

/* ─── Screen title (Space Grotesk style — bold 17) ─── */
export function ScreenTitle({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.screenTitleRow}>
      <Text style={styles.screenTitle}>{title}</Text>
      {right}
    </View>
  );
}

export function SectionLabel({
  label,
  action,
  onAction,
}: {
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── Avatar with gradient ─── */
export function GradAvatar({
  initials,
  size = 44,
  gradient = 'primary',
  online,
  uri,
}: {
  initials: string;
  size?: number;
  gradient?: 'primary' | 'accent' | 'muted';
  online?: boolean;
  uri?: string | null;
}) {
  if (uri) {
    const img = (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.avatarBg }}
      />
    );
    if (!online) return img;
    return (
      <View>
        {img}
        <View style={styles.onlineDot} />
      </View>
    );
  }

  const inner = (
    <View
      style={[
        styles.avatarInner,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: gradient === 'muted' ? C.avatarMuted : C.avatarBg,
        },
      ]}
    >
      <Text
        style={[
          styles.avatarText,
          {
            fontSize: size * 0.28,
            color: gradient === 'muted' ? C.textDim : C.onGrad,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );

  const avatar =
    gradient === 'muted' ? (
      inner
    ) : (
      <LinearGradient
        colors={[...(gradient === 'accent' ? Gradients.accent : Gradients.primary)]}
        style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.28, color: C.onGrad }]}>{initials}</Text>
      </LinearGradient>
    );

  if (!online) return avatar;

  return (
    <View>
      {avatar}
      <View style={styles.onlineDot} />
    </View>
  );
}

/* ─── Gradient ring avatar ─── */
export function RingAvatar({
  initials,
  size = 34,
  uri,
}: {
  initials: string;
  size?: number;
  uri?: string | null;
}) {
  return (
    <LinearGradient
      colors={[...Gradients.primary]}
      style={{ width: size, height: size, borderRadius: size / 2, padding: 2 }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            flex: 1,
            borderRadius: size / 2,
            backgroundColor: C.avatarBg,
          }}
        />
      ) : (
        <View
          style={{
            flex: 1,
            borderRadius: size / 2,
            backgroundColor: C.avatarBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: size * 0.32, fontWeight: '600', color: C.text }}>{initials}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

/* ─── Glass icon button (bell etc) ─── */
export function GlassIconBtn({
  icon,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  badge?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.glassIconBtn}>
        <Ionicons name={icon} size={16} color={C.textDim} />
        {badge && <View style={styles.badgeDot} />}
      </View>
    </TouchableOpacity>
  );
}

/* ─── Gradient thumb for course cards ─── */
export function GradThumb({
  width,
  height,
  colors = Gradients.primary,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={[...colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width, height, borderRadius: 10 }, style]}
    />
  );
}

/* ─── Progress bar ─── */
export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <LinearGradient
        colors={[...Gradients.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressFill, { width: `${Math.min(100, value)}%` }]}
      />
    </View>
  );
}

/* ─── Screen background with optional glow ─── */
export function Screen({ children, glow }: { children: React.ReactNode; glow?: boolean }) {
  return (
    <View style={styles.screen}>
      {glow && (
        <View style={styles.glowOrb} pointerEvents="none" />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  glowOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: C.g1a,
    opacity: 0.2,
  },
  glass: {
    backgroundColor: C.glass,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
  },
  gradBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: C.g1a,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  gradBtnCompact: { paddingVertical: 9 },
  gradBtnText: { color: C.onGrad, fontWeight: '600', fontSize: 13 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipGlass: {
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
  },
  chipAccent: {
    backgroundColor: 'rgba(34,225,255,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(34,225,255,0.3)',
  },
  chipRow: { flexDirection: 'row', alignItems: 'center' },
  chipText: { fontSize: 11, fontWeight: '500', color: C.textDim },
  chipTextSelected: { color: C.onGrad, fontWeight: '600' },
  chipTextAccent: { color: C.g1a },
  searchWrap: { marginBottom: 0 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 11, color: C.text, padding: 0 },
  searchPlaceholder: { fontSize: 11, color: C.textMute },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  screenTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: C.textDim },
  sectionAction: { fontSize: 11, color: C.g1a },
  avatarInner: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '600' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: C.g2a,
    borderWidth: 2,
    borderColor: C.bg,
  },
  glassIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.g2a,
  },
  progressTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
});
