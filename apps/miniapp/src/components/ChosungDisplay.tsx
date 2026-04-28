import { colors, spacing } from '@/design/tokens';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  chosung: string;
  length: number;
}

export function ChosungDisplay({ chosung, length }: Props) {
  const chars = [...chosung];
  return (
    <View style={styles.container} accessibilityLabel={`초성 ${chosung}, ${length}글자`}>
      <View style={styles.row}>
        {chars.map((c, i) => (
          <View key={`pos-${i}-${c}`} style={styles.cell}>
            <Text style={styles.letter}>{c}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.length}>{length}글자</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    width: 64,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.blue700,
    letterSpacing: 1,
  },
  length: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.gray500,
  },
});
