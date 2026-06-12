import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

interface CreditScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CreditScoreGauge({
  score,
  size = 200,
  strokeWidth = 16,
  showDetails = true,
}: CreditScoreGaugeProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = Math.min(Math.max(score, 0), 100) / 100;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: scorePercent,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [scorePercent]);

  // Stroke Dashoffset calculation
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // Dynamic Grade & Risk based on score
  let grade = 'D';
  let riskRating = 'HIGH RISK';
  let scoreColor = colors.error;

  if (score >= 90) {
    grade = 'A+';
    riskRating = 'LOW RISK';
    scoreColor = colors.primary;
  } else if (score >= 80) {
    grade = 'A';
    riskRating = 'LOW RISK';
    scoreColor = colors.primary;
  } else if (score >= 70) {
    grade = 'B+';
    riskRating = 'MEDIUM RISK';
    scoreColor = colors.warning;
  } else if (score >= 60) {
    grade = 'B';
    riskRating = 'MEDIUM RISK';
    scoreColor = colors.warning;
  } else if (score >= 50) {
    grade = 'C';
    riskRating = 'MEDIUM RISK';
    scoreColor = colors.warning;
  } else {
    grade = 'D';
    riskRating = 'HIGH RISK';
    scoreColor = colors.error;
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="scoreGradient" x1="0%" y1="100%" x2="100%" y2="0%"><Stop offset="0%" stopColor="#EF4444" /><Stop offset="50%" stopColor="#F59E0B" /><Stop offset="100%" stopColor="#10B981" /></LinearGradient>
        </Defs>

        {/* Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Centered Score details */}
      <View style={styles.contentContainer}>
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.outOfText}>AgriScore</Text>
        {showDetails && (
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: scoreColor + '15' }]}>
              <Text style={[styles.gradeText, { color: scoreColor }]}>Grade {grade}</Text>
            </View>
            <Text style={[styles.riskText, { color: scoreColor }]}>{riskRating}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.charcoal,
    lineHeight: 48,
  },
  outOfText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  riskText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
