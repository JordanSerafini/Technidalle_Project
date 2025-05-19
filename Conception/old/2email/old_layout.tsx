import MailSummary from '@/app/components/2email/MailSummary';
import React from 'react';
import { SafeAreaView, StyleSheet } from "react-native";

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <MailSummary />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  }
});