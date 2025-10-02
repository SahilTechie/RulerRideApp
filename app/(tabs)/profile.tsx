import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '@/services/auth';

const menuItems = [
  { icon: 'person-outline', title: 'Edit Profile', titleHindi: 'प्रोफ़ाइल संपादित करें', action: 'edit' },
  { icon: 'wallet-outline', title: 'Payment Methods', titleHindi: 'भुगतान के तरीके', action: 'payment' },
  { icon: 'notifications-outline', title: 'Notifications', titleHindi: 'सूचनाएं', action: 'notifications' },
  { icon: 'help-circle-outline', title: 'Help & Support', titleHindi: 'सहायता और समर्थन', action: 'help' },
  { icon: 'star-outline', title: 'Rate Us', titleHindi: 'हमें रेट करें', action: 'rate' },
  { icon: 'share-outline', title: 'Refer Friends', titleHindi: 'दोस्तों को रेफर करें', action: 'refer' },
  { icon: 'document-text-outline', title: 'Terms & Conditions', titleHindi: 'नियम और शर्तें', action: 'terms' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [userPhone, setUserPhone] = useState('+91 9876543210'); // Default fallback
  const [userName, setUserName] = useState('RulerRide User');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Try to get phone number from AsyncStorage
      const storedPhone = await AsyncStorage.getItem('user_phone');
      if (storedPhone) {
        setUserPhone(storedPhone);
      }

      // Try to get user name from AsyncStorage
      const storedName = await AsyncStorage.getItem('user_name');
      if (storedName) {
        setUserName(storedName);
      }

      // Try to get user data from auth service
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        if (currentUser.name && currentUser.name !== 'New User') {
          setUserName(currentUser.name);
        }
        if (currentUser.phone) {
          setUserPhone(currentUser.phone);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Keep default values if error occurs
    }
  };

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'edit':
        router.push('/edit-profile');
        break;
      case 'payment':
        router.push('/payment-methods');
        break;
      case 'notifications':
        router.push('/notifications');
        break;
      case 'help':
        router.push('/help-support');
        break;
      case 'rate':
        Alert.alert('Rate Us', 'Thank you for considering rating RulerRide!');
        break;
      case 'refer':
        Alert.alert('Refer Friends', 'Share your referral code: RULER2024');
        break;
      case 'terms':
        Alert.alert('Terms & Conditions', 'Terms and conditions will be displayed here');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => router.replace('/login'),
          style: 'destructive' 
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="white" />
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userPhone}>{userPhone}</Text>
          <View style={styles.newUserBadge}>
            <Ionicons name="person-add" size={16} color="#3B82F6" />
            <Text style={styles.newUserText}>New User</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeHeader}>
            <Ionicons name="hand-right" size={24} color="#DC2626" />
            <Text style={styles.welcomeTitle}>Welcome to RulerRide!</Text>
          </View>
          <Text style={styles.welcomeSubtitle}>
            Complete your profile to get started with safe and affordable rides.
          </Text>
          <Text style={styles.welcomeSubtitleHindi}>
            सुरक्षित और किफायती सवारी शुरू करने के लिए अपनी प्रोफ़ाइल पूरी करें।
          </Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.action)}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={24} color="#DC2626" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuTitleHindi}>{item.titleHindi}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#DC2626" />
          <Text style={styles.logoutText}>Logout / लॉग आउट</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>RulerRide v1.0.0</Text>
          <Text style={styles.footerText}>Made with ❤️ for rural India</Text>
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
    paddingBottom: 30,
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userNameHindi: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  newUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  newUserText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 4,
  },
  welcomeSubtitleHindi: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  menuTitleHindi: {
    fontSize: 14,
    color: '#64748B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 30,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
});