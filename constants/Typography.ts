import { StyleSheet, TextStyle } from 'react-native';

export const FontFamilies = {
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
  playfairBold: 'PlayfairDisplay_700Bold',
} as const;

export const Typography = StyleSheet.create({
  H1: {
    fontFamily: FontFamilies.playfairBold,
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,
  H2: {
    fontFamily: FontFamilies.playfairBold,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  H3: {
    fontFamily: FontFamilies.playfairBold,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  Body: {
    fontFamily: FontFamilies.interRegular,
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,
  BodySmall: {
    fontFamily: FontFamilies.interRegular,
    fontSize: 11,
    lineHeight: 16,
  } as TextStyle,
  Caption: {
    fontFamily: FontFamilies.interRegular,
    fontSize: 9,
    lineHeight: 13,
  } as TextStyle,
  ButtonLabel: {
    fontFamily: FontFamilies.interBold,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  NumberLarge: {
    fontFamily: FontFamilies.interBold,
    fontSize: 22,
    lineHeight: 30,
  } as TextStyle,
  NumberMedium: {
    fontFamily: FontFamilies.interSemiBold,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
});

export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 3,
};
