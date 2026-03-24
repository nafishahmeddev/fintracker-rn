import { BlurView } from '@sbaiahmed1/react-native-blur';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export type BlurCircle = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  color: string;
};

type BlurBackgroundProps = {
  /**
   * Override the three decorative circles. When omitted, the theme-default
   * circles are used (bold primary + secondary blobs).
   */
  circles?: BlurCircle[];
  /** Override blur intensity (default: 80 iOS / 96 Android). */
  blurAmount?: number;
  /**
   * Two-character hex opacity suffix for the Android translucency overlay,
   * e.g. '60'. Defaults to '60'.
   */
  androidOverlayOpacity?: string;
};

/**
 * Full-screen frosted-glass background: decorative circles → BlurView →
 * Android translucency overlay. Drop this as the first child inside any
 * SafeAreaView / container View and it renders behind everything.
 */
export function BlurBackground({
  circles,
  blurAmount,
  androidOverlayOpacity = '60',
}: BlurBackgroundProps) {
  const { colors, isDark } = useTheme();

  const defaultCircles: BlurCircle[] = React.useMemo(
    () => [
      { top: -100, left: -80, width: 360, height: 360, color: colors.primary + '70' },
      { top: 220, right: -140, width: 460, height: 460, color: colors.primary + '40' },
      { bottom: -80, left: -60, width: 300, height: 300, color: colors.secondary + '50' },
    ],
    [colors.primary, colors.secondary],
  );

  const resolvedCircles = circles ?? defaultCircles;
  const resolvedBlurAmount = blurAmount ?? (Platform.OS === 'ios' ? 80 : 96);

  return (
    <>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {resolvedCircles.map((circle, index) => (
          <View
            key={index}
            style={[
              styles.circle,
              {
                top: circle.top,
                bottom: circle.bottom,
                left: circle.left,
                right: circle.right,
                width: circle.width,
                height: circle.height,
                backgroundColor: circle.color,
              },
            ]}
          />
        ))}
      </View>

      <BlurView
        blurAmount={resolvedBlurAmount}
        blurType={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />

      {Platform.OS === 'android' ? (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: colors.background + androidOverlayOpacity },
          ]}
          pointerEvents="none"
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
});
