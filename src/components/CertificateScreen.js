import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Modal, SafeAreaView, Platform, Share,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function CertificateScreen({ visible, module, onClose }) {
  if (!module) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just earned the "${module.guruTitle}" certification on Kesandu Guru! I mastered ${module.challenges.length} challenges about "${module.title}" including concept checks, teach-back, and real-world application scenarios. #KesanduGuru #AIEducation`,
        title: 'Kesandu Guru Certificate',
      });
    } catch (e) {
      // User cancelled or share failed
    }
  };

  const today = new Date();
  const dateStr = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.certificate}>
          <View style={styles.border}>
            <View style={styles.innerBorder}>
              {/* Header */}
              <Text style={styles.headerAccent}>KESANDU GURU</Text>
              <View style={styles.divider} />
              <Text style={styles.certTitle}>CERTIFICATE OF MASTERY</Text>
              <View style={styles.divider} />

              {/* Body */}
              <Text style={styles.bodyText}>This certifies mastery of</Text>
              <Text style={styles.topicTitle}>{module.title}</Text>
              <Text style={styles.guruTitle}>{module.guruTitle}</Text>

              {/* Challenge breakdown */}
              <View style={styles.challengeList}>
                {module.challenges.map((c, i) => (
                  <Text key={c.id} style={styles.challengeItem}>
                    {c.type === 'CONCEPT_CHECK' ? 'Concept Check' : c.type === 'TEACH_BACK' ? 'Teach Back' : 'Real-World Application'}
                    {' - '}{c.title}
                  </Text>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.divider} />
              <Text style={styles.dateText}>{dateStr}</Text>
              <Text style={styles.xpText}>+{module.xp} XP Earned</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share your certificate"
            >
              <Text style={styles.shareBtnText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close certificate"
            >
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  certificate: {
    width: width * 0.9,
    alignItems: 'center',
  },
  border: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  headerAccent: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 12,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginVertical: 12,
  },
  certTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  bodyText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  topicTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  guruTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 1,
  },
  challengeList: {
    marginTop: 16,
    gap: 4,
    alignItems: 'center',
  },
  challengeItem: {
    color: '#AAA',
    fontSize: 11,
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  xpText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#222',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  closeBtnText: {
    color: '#AAA',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
});
