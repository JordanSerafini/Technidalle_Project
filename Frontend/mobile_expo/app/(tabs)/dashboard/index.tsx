import MailSummary from '@/app/components/email/MailSummary';
import React from 'react';
import { SafeAreaView, StyleSheet, Text } from "react-native";

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.container}>

      <Text>Dashboard</Text>
     </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  }
});