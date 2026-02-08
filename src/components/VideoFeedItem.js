import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Play, Brain } from 'lucide-react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import THEME from '../constants/theme';
import GuruBadge from './GuruBadge';

const { width, height } = Dimensions.get('window');

const PLAYER_PARAMS = Object.freeze({
  controls: false,
  modestbranding: true,
  loop: true,
  rel: false,
});

const WEBVIEW_PROPS = Object.freeze({
  androidLayerType: 'hardware',
  allowsInlineMediaPlayback: true,
  scrollEnabled: false,
});

const VideoFeedItem = React.memo(
  ({ item, isActive, onEnter, moduleProgress }) => {
    const [playing, setPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      if (isActive) {
        setPlaying(true);
      } else {
        setPlaying(false);
        setIsReady(false);
      }
    }, [isActive]);

    const onStateChange = useCallback((state) => {
      if (state === 'playing') setIsReady(true);
      if (state === 'ended') setPlaying(false);
    }, []);

    const handlePlay = useCallback(() => setPlaying(true), []);
    const handleEnter = useCallback(() => onEnter(item), [item, onEnter]);

    return (
      <View style={{ width, height, backgroundColor: '#000' }}>
        {isActive ? (
          <View style={styles.videoContainer}>
            <YoutubePlayer
              height={height}
              width={width}
              videoId={item.youtubeId}
              play={playing}
              onChangeState={onStateChange}
              initialPlayerParams={PLAYER_PARAMS}
              webViewProps={WEBVIEW_PROPS}
            />
            {!isReady && (
              <TouchableOpacity style={styles.manualPlayOverlay} onPress={handlePlay}>
                <Play size={40} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.8)" />
                <Text style={styles.tapToPlayText}>TAP TO PLAY</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.offscreenPlaceholder}>
            <Play size={32} color="rgba(255,255,255,0.3)" />
          </View>
        )}

        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <GuruBadge
                guruTitle={item.guruTitle}
                isGuru={moduleProgress.isGuru}
                progress={moduleProgress}
              />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.creator}>{item.creator}</Text>

            <View style={styles.moduleProgressRow}>
              <View style={styles.moduleProgressTrack}>
                <View
                  style={[
                    styles.moduleProgressFill,
                    {
                      width: `${moduleProgress.total > 0 ? (moduleProgress.done / moduleProgress.total) * 100 : 0}%`,
                      backgroundColor: moduleProgress.isGuru ? THEME.guru : THEME.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[
                styles.moduleProgressText,
                moduleProgress.isGuru && { color: THEME.guru },
              ]}>
                {moduleProgress.isGuru
                  ? 'GURU'
                  : `${moduleProgress.done}/${moduleProgress.total}`}
              </Text>
            </View>

            <Text style={styles.challengeCount}>
              {item.challenges.length} challenge{item.challenges.length > 1 ? 's' : ''} {'\u2022'} +{item.xp} XP
            </Text>

            <TouchableOpacity
              style={[
                styles.dojoBtn,
                moduleProgress.isGuru && styles.dojoBtnGuru,
              ]}
              onPress={handleEnter}
              accessibilityRole="button"
              accessibilityLabel={moduleProgress.isGuru ? `Review ${item.title} dojo` : `Enter ${item.title} dojo`}
            >
              <Brain size={20} color="#000" />
              <Text style={styles.dojoBtnText}>
                {moduleProgress.isGuru ? 'REVIEW DOJO' : 'ENTER DOJO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.isActive === next.isActive &&
    prev.moduleProgress.done === next.moduleProgress.done
);

const styles = StyleSheet.create({
  videoContainer: {
    width,
    height,
    position: 'absolute',
    justifyContent: 'center',
  },
  offscreenPlaceholder: {
    width,
    height,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tapToPlayText: {
    color: '#FFF',
    marginTop: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlayContent: { gap: 6 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: '#DDD',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  creator: { color: '#CCC', fontSize: 15 },
  challengeCount: { color: '#999', fontSize: 13 },
  moduleProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  moduleProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  moduleProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  moduleProgressText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 35,
  },
  dojoBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  dojoBtnGuru: { backgroundColor: THEME.guru },
  dojoBtnText: { fontWeight: 'bold', fontSize: 16, color: '#000' },
});

export default VideoFeedItem;
