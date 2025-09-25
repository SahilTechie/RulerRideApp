import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const helpCategories = [
  {
    title: 'Quick Help',
    titleHindi: 'त्वरित सहायता',
    items: [
      { icon: 'call', title: 'Call Support', subtitle: '24/7 helpline', action: 'call', value: '+91-1800-123-4567' },
      { icon: 'chatbubble', title: 'Live Chat', subtitle: 'Chat with our team', action: 'chat' },
      { icon: 'mail', title: 'Email Support', subtitle: 'Get help via email', action: 'email', value: 'support@rulerride.com' },
    ]
  },
  {
    title: 'Common Issues',
    titleHindi: 'सामान्य समस्याएं',
    items: [
      { icon: 'car', title: 'Booking Issues', subtitle: 'Problems with ride booking', action: 'faq', category: 'booking' },
      { icon: 'card', title: 'Payment Problems', subtitle: 'Payment and billing issues', action: 'faq', category: 'payment' },
      { icon: 'person', title: 'Driver Issues', subtitle: 'Problems with driver', action: 'faq', category: 'driver' },
      { icon: 'shield', title: 'Safety Concerns', subtitle: 'Report safety issues', action: 'safety' },
    ]
  },
  {
    title: 'Account & App',
    titleHindi: 'खाता और ऐप',
    items: [
      { icon: 'person-circle', title: 'Account Settings', subtitle: 'Manage your account', action: 'account' },
      { icon: 'phone-portrait', title: 'App Issues', subtitle: 'Technical problems', action: 'technical' },
      { icon: 'star', title: 'Feedback', subtitle: 'Share your experience', action: 'feedback' },
    ]
  }
];

const faqs = [
  {
    question: 'How do I book a ride?',
    questionHindi: 'मैं सवारी कैसे बुक करूं?',
    answer: 'Open the app, enter your pickup and destination, select vehicle type, and tap "Book Ride".',
    answerHindi: 'ऐप खोलें, अपना पिकअप और गंतव्य दर्ज करें, वाहन प्रकार चुनें, और "बुक राइड" पर टैप करें।'
  },
  {
    question: 'How can I cancel my ride?',
    questionHindi: 'मैं अपनी सवारी कैसे रद्द कर सकता हूं?',
    answer: 'Go to your active ride screen and tap the "Cancel" button. Cancellation charges may apply.',
    answerHindi: 'अपनी सक्रिय सवारी स्क्रीन पर जाएं और "रद्द करें" बटन पर टैप करें। रद्दीकरण शुल्क लागू हो सकता है।'
  },
  {
    question: 'What payment methods are accepted?',
    questionHindi: 'कौन से भुगतान तरीके स्वीकार किए जाते हैं?',
    answer: 'We accept UPI, debit/credit cards, digital wallets, and cash payments.',
    answerHindi: 'हम UPI, डेबिट/क्रेडिट कार्ड, डिजिटल वॉलेट और नकद भुगतान स्वीकार करते हैं।'
  }
];

export default function HelpSupportScreen() {
  const router = useRouter();

  const handleAction = async (action: string, value?: string) => {
    switch (action) {
      case 'call':
        if (value) {
          Linking.openURL(`tel:${value}`);
        }
        break;
      case 'email':
        if (value) {
          Linking.openURL(`mailto:${value}`);
        }
        break;
      case 'chat':
        Alert.alert('Live Chat', 'Live chat feature will be available soon');
        break;
      case 'safety':
        Alert.alert('Safety Report', 'Safety reporting feature will be available soon');
        break;
      case 'feedback':
        Alert.alert('Feedback', 'Thank you for wanting to share feedback! This feature will be available soon.');
        break;
      default:
        Alert.alert('Help', 'This help section will be available soon');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>सहायता और समर्थन</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.emergencyCard}>
          <Ionicons name="warning" size={32} color="#DC2626" />
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Emergency? Call Now!</Text>
            <Text style={styles.emergencySubtitle}>आपातकाल? अभी कॉल करें!</Text>
            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={() => handleAction('call', '112')}
            >
              <Text style={styles.emergencyButtonText}>Call 112</Text>
            </TouchableOpacity>
          </View>
        </View>

        {helpCategories.map((category, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{category.title}</Text>
            <Text style={styles.sectionSubtitle}>{category.titleHindi}</Text>
            <View style={styles.itemsContainer}>
              {category.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.helpItem}
                  onPress={() => handleAction(item.action, 'value' in item ? item.value : undefined)}
                >
                  <View style={styles.helpIcon}>
                    <Ionicons name={item.icon as any} size={24} color="#DC2626" />
                  </View>
                  <View style={styles.helpText}>
                    <Text style={styles.helpTitle}>{item.title}</Text>
                    <Text style={styles.helpSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSubtitle}>अक्सर पूछे जाने वाले प्रश्न</Text>
          <View style={styles.faqContainer}>
            {faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqQuestionHindi}>{faq.questionHindi}</Text>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                <Text style={styles.faqAnswerHindi}>{faq.answerHindi}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={20} color="#64748B" />
            <Text style={styles.contactText}>+91-1800-123-4567</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color="#64748B" />
            <Text style={styles.contactText}>support@rulerride.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="time" size={20} color="#64748B" />
            <Text style={styles.contactText}>24/7 Support Available</Text>
          </View>
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
  emergencyCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  emergencyContent: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  emergencySubtitle: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 8,
  },
  emergencyButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: '600',
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
  itemsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  helpSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  faqContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  faqQuestionHindi: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  faqAnswerHindi: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  contactInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#64748B',
  },
});