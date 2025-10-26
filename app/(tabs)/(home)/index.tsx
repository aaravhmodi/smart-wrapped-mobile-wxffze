
import React from "react";
import { Stack } from "expo-router";
import { StyleSheet, View, Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import WrappedDashboard from "@/components/WrappedDashboard";
import { colors } from "@/styles/commonStyles";

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Spotify Wrapped",
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <WrappedDashboard />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
