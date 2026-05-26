import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

import { colors } from '@/theme/colors';

interface LiveScoreProps {
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
}

export const LiveScore = memo(function LiveScore({
  homeScore,
  awayScore,
  homeTeam,
  awayTeam,
}: LiveScoreProps): React.JSX.Element {
  const flashAnim = useRef(new Animated.Value(1)).current;
  const prevHomeScore = useRef(homeScore);
  const prevAwayScore = useRef(awayScore);

  useEffect(() => {
    const scoreChanged =
      homeScore !== prevHomeScore.current ||
      awayScore !== prevAwayScore.current;

    if (scoreChanged) {
      // Flash animation on goal
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0.3,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      prevHomeScore.current = homeScore;
      prevAwayScore.current = awayScore;
    }
  }, [homeScore, awayScore, flashAnim]);

  // Pulse animation for the LIVE indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Live badge */}
      <View style={styles.liveRow}>
        <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
        <Text style={styles.liveText}>AN DIRÈK</Text>
      </View>

      {/* Score + teams */}
      <View style={styles.scoreRow}>
        <Text style={styles.teamName} numberOfLines={1}>
          {homeTeam}
        </Text>

        <Animated.View style={[styles.scoreBox, { opacity: flashAnim }]}>
          <Text style={styles.score}>
            {homeScore}
          </Text>
          <Text style={styles.scoreSep}> – </Text>
          <Text style={styles.score}>
            {awayScore}
          </Text>
        </Animated.View>

        <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
          {awayTeam}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.haitiRed,
  },
  liveText: {
    color: colors.haitiRed,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  teamName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  teamNameRight: {
    textAlign: 'center',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  score: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    minWidth: 30,
    textAlign: 'center',
  },
  scoreSep: {
    color: colors.textMuted,
    fontSize: 24,
    fontWeight: '300',
    paddingHorizontal: 4,
  },
});
