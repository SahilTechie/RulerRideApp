import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const [settings, setSettings] = useState({
    rideUpdates: true,
    promotions: false,
    safety: true,
    payment: true,
    driver: true,
    emergency: true,
    marketing: false,
    sound: true,
    vibration: true,
  });

  const router = useRouter();

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const notificationCategories = [
    {
      title: 'Ride Notifications',
      titleHindi: 'सवारी की सूचनाएं',
      items: [
        { key: 'rideUpdates', title: 'Ride Updates', subtitle: 'Booking confirmations, driver arrival, trip status', icon: 'car' },
        { key: 'driver', title: 'Driver Messages', subtitle: 'Messages from your driver', icon: 'chatbubble' },
      ]
    },
    {
      title: 'Safety & Security',
      titleHindi: 'सुरक्षा और सुरक्षा',
      items: [
        { key: 'safety', title: 'Safety Alerts', subtitle: 'Emergency contacts, safety tips', icon: 'shield-checkmark' },
        { key: 'emergency', title: 'Emergency Notifications', subtitle: 'SOS alerts and emergency updates', icon: 'warning' },
      ]
    },
    {
      title: 'Payment & Billing',
      titleHindi: 'भुगतान और बिलिंग',
      items: [
        { key: 'payment', title: 'Payment Updates', subtitle: 'Payment confirmations, receipts', icon: 'card' },
      ]
    },
    {
      title: 'Promotions & Offers',
      titleHindi: 'प्रमोशन और ऑफर',
      items: [
        { key: 'promotions', title: 'Special Offers', subtitle: 'Discounts, cashback offers', icon: 'gift' },
        { key: 'marketing', title: 'Marketing Updates', subtitle: 'New features, app updates', icon: 'megaphone' },
      ]
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>सूचनाएं</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Stay Updated</Text>
            <Text style={styles.infoText}>
              Customize your notification preferences to stay informed about your rides and important updates.
            </Text>
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings / सामान्य सेटिंग्स</Text>
          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high" size={24} color="#DC2626" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Sound</Text>
                  <Text style={styles.settingSubtitle}>Play notification sounds</Text>
                </View>
              </View>
              <Switch
                value={settings.sound}
                onValueChange={() => toggleSetting('sound')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={settings.sound ? '#DC2626' : '#9CA3AF'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait" size={24} color="#DC2626" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Vibration</Text>
                  <Text style={styles.settingSubtitle}>Vibrate for notifications</Text>
                </View>
              </View>
              <Switch
                value={settings.vibration}
                onValueChange={() => toggleSetting('vibration')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={settings.vibration ? '#DC2626' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        {/* Notification Categories */}
        {notificationCategories.map((category, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{category.title}</Text>
            <Text style={styles.sectionSubtitle}>{category.titleHindi}</Text>
            <View style={styles.settingsContainer}>
              {category.items.map((item) => (
                <View key={item.key} style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingIcon}>
                      <Ionicons name={item.icon as any} size={20} color="#DC2626" />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Switch
                    value={settings[item.key as keyof typeof settings]}
                    onValueChange={() => toggleSetting(item.key)}
                    trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                    thumbColor={settings[item.key as keyof typeof settings] ? '#DC2626' : '#9CA3AF'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can change these settings anytime. Critical safety notifications cannot be disabled.
          </Text>
          <Text style={styles.footerTextHindi}>
            आप इन सेटिंग्स को कभी भी बदल सकते हैं। महत्वपूर्ण सुरक्षा सूचनाओं को अक्षम नहीं किया जा सकता।
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  footerText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 4,
  },
  footerTextHindi: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
});