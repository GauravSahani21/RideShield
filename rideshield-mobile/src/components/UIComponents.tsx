import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';
import { radius, spacing, typography } from '../theme';

// ----------------------------------------------------
// BUTTON COMPONENT
// ----------------------------------------------------
interface ButtonProps {
  label?: string;
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export const AppButton: React.FC<ButtonProps> = ({
  label,
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}) => {
  const { theme } = useAppTheme();
  const displayLabel = title || label || '';

  const getBg = () => {
    if (disabled) return theme.surfaceMuted;
    if (variant === 'primary') return theme.primary;
    if (variant === 'danger') return theme.danger;
    if (variant === 'secondary') return theme.surfaceElevated;
    if (variant === 'outline') return theme.surface;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return theme.textMuted;
    if (variant === 'primary') return '#ffffff';
    if (variant === 'danger') return '#ffffff';
    if (variant === 'secondary') return theme.textPrimary;
    if (variant === 'outline') return theme.primary;
    return theme.primary;
  };

  const getBorder = () => {
    if (variant === 'secondary') return { borderWidth: 1, borderColor: theme.border };
    if (variant === 'outline') return { borderWidth: 1, borderColor: theme.border };
    if (variant === 'ghost') return { borderWidth: 1, borderColor: 'transparent' };
    return {};
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBg() },
        getBorder(),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.btnRow}>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={18}
              color={getTextColor()}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[styles.btnText, { color: getTextColor() }]}>{displayLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ----------------------------------------------------
// CARD COMPONENT
// ----------------------------------------------------
interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

export const AppCard: React.FC<CardProps> = ({ children, style, onPress }) => {
  const { theme } = useAppTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// ----------------------------------------------------
// BADGE COMPONENT
// ----------------------------------------------------
interface BadgeProps {
  label: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  icon?: string;
  size?: 'sm' | 'md';
}

export const AppBadge: React.FC<BadgeProps> = ({
  label,
  type,
  variant,
  icon,
  size = 'sm',
}) => {
  const { theme } = useAppTheme();
  const effectiveType = variant || type || 'neutral';

  const getStyles = () => {
    switch (effectiveType) {
      case 'primary':
      case 'info':
        return { bg: theme.primaryLight, text: theme.primary };
      case 'success':
        return { bg: theme.successLight, text: theme.success };
      case 'warning':
        return { bg: theme.warningLight, text: theme.warning };
      case 'danger':
        return { bg: theme.dangerLight, text: theme.danger };
      default:
        return { bg: theme.surfaceMuted, text: theme.textSecondary };
    }
  };

  const { bg, text } = getStyles();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'md' && { paddingVertical: 6, paddingHorizontal: 10 },
      ]}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={size === 'md' ? 14 : 12}
          color={text}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.badgeText,
          { color: text },
          size === 'md' && { fontSize: typography.sizes.xs },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// ----------------------------------------------------
// PAGE HEADER COMPONENT
// ----------------------------------------------------
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}

export const AppPageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  rightElement,
  onBack,
}) => {
  const { theme } = useAppTheme();
  const rightContent = rightElement || action;

  return (
    <View style={[styles.pageHeader, { borderBottomColor: theme.borderLight, backgroundColor: theme.surface }]}>
      <View style={styles.headerLeft}>
        {onBack && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightContent && <View>{rightContent}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  backBtn: {
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  pageTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
  },
  pageSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
