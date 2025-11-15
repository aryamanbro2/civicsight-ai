import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, Dimensions,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
 } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  Report,
  getComments,
  postComment,
  ReportComment 
} from '../services/reportService'; 

// Get screen width for full image display
const { width } = Dimensions.get('window');

// --- DARK THEME & CONSTANTS ---
const DARK_COLORS = {
  BACKGROUND: '#121212', 
  CARD: '#1E1E1E',       
  PRIMARY: '#BB86FC',    
  ACCENT: '#03DAC6',     
  TEXT: '#E0E0E0',       
  SECONDARY_TEXT: '#B0B0B0', 
  BORDER: '#333333',     
};

// Define Route Params
type ReportDetailRouteParams = {
  report: Report;
};

type RootStackParamList = {
  ReportDetail: ReportDetailRouteParams;
};

type ReportDetailScreenRouteProp = RouteProp<RootStackParamList, 'ReportDetail'>;

// Function to determine colors based on AI's priority score
const getPriorityColor = (priority: Report['priority']) => {
  switch (priority) {
    case 'high': return '#CF6679'; 
    case 'medium': return '#FFB300'; 
    case 'low': 
    default: return '#03DAC6'; 
  }
};


// --- Comment Item Component ---
const CommentItem = ({ comment }: { comment: ReportComment }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentHeader}>
        <Text style={styles.commentUser}>{comment.userId.name}</Text>
        <Text style={styles.commentDate}> • {new Date(comment.createdAt).toLocaleDateString()}</Text>
      </Text>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
);
// --- End Comment Item Component ---


const ReportDetailScreen = () => {
  const route = useRoute<ReportDetailScreenRouteProp>();
  const { report } = route.params;
  const insets = useSafeAreaInsets();
  const statusColor = report.status === 'completed' 
    ? DARK_COLORS.ACCENT
    : report.status === 'in_progress' 
    ? DARK_COLORS.PRIMARY
    : '#B0B0B0';
  
  const priorityColor = getPriorityColor(report.priority);

  // --- COMMENT STATE & LOGIC ---
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [report.id]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await getComments(report.id);
      setComments(response.comments);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not load comments.');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
      const textToPost = newComment;
      setNewComment(""); 
      
      const response = await postComment(report.id, textToPost);
      // Add the new comment to the top of the list
      setComments(prevComments => [response.comment, ...prevComments]); 
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not post comment.');
    }
  };

  // --- HEADER COMPONENT (Existing content from old ScrollView) ---
  const ReportHeaderComponent = () => (
    <>
      {/* Image Display (if it exists) */}
      {report.imageUrl && (
        <Image 
          source={{ uri: report.imageUrl }} 
          style={styles.fullImage} 
          resizeMode="cover"
        />
      )}

      {/* Audio Display (if it exists) */}
      {report.audioUrl && (
          <View style={[
            styles.audioPlaceholder, 
            report.imageUrl ? styles.audioWithImage : styles.audioOnly
          ]}>
              <Ionicons name="mic-circle-outline" size={80} color={DARK_COLORS.PRIMARY} />
              <Text style={styles.audioText}>Audio Report Playback</Text>
              <Text style={styles.audioSubText}>
                {/* TODO: Implement audio playback on press */}
                Media URL: {report.audioUrl?.substring(0, 40)}...
              </Text>
          </View>
      )}

      {/* Fallback (if neither exists) */}
      {!report.imageUrl && !report.audioUrl && (
          <View style={[styles.audioPlaceholder, styles.audioOnly]}>
            <Ionicons name="alert-circle-outline" size={80} color={DARK_COLORS.SECONDARY_TEXT} />
            <Text style={styles.audioText}>No Media Found</Text>
          </View>
      )}


      <View style={styles.content}>
        <Text style={styles.issueType}>{report.issueType.toUpperCase()}</Text>
        
        {/* Status and Priority Badges */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>STATUS: {report.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: priorityColor, marginLeft: 10 }]}>
            <Text style={styles.badgeText}>PRIORITY: {report.priority.toUpperCase()}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}><Ionicons name="document-text-outline" size={18} color={DARK_COLORS.TEXT} /> Description</Text>
          <Text style={styles.detailText}>{report.description}</Text>
        </View>

        {/* Location */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}><Ionicons name="location-outline" size={18} color={DARK_COLORS.TEXT} /> Location</Text>
          <Text style={styles.detailText}>{report.location.address || 'Address Not Available'}</Text>
          <Text style={styles.subDetailText}>
            Coordinates: {report.location.coordinates[1]}, {report.location.coordinates[0]}
          </Text>
          <Text style={styles.subDetailText}>
            {report.location.city}, {report.location.state} {report.location.zipCode}
          </Text>
        </View>

        {/* Metadata */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}><Ionicons name="information-circle-outline" size={18} color={DARK_COLORS.TEXT} /> AI Metadata</Text>
          <Text style={styles.subDetailText}>Reported: {new Date(report.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.subDetailText}>Severity Score: {report.severityScore}</Text>
          <Text style={styles.subDetailText}>Tags: {report.aiMetadata?.tags?.join(', ') || 'N/A'}</Text>
        </View>
        
        {/* Comments Section Header */}
        <Text style={[styles.detailTitle, { marginTop: 20, borderBottomWidth: 1, borderBottomColor: DARK_COLORS.BORDER, paddingBottom: 10 }]}>
            <Ionicons name="chatbubbles-outline" size={18} color={DARK_COLORS.TEXT} /> Community Discussion
        </Text>
        {isLoadingComments && <ActivityIndicator color={DARK_COLORS.PRIMARY} style={{marginVertical: 10}} />}
        {!isLoadingComments && comments.length === 0 && (
          <Text style={styles.subDetailText}>Be the first to comment on this issue.</Text>
        )}
      </View>
    </>
  );
  // --- END HEADER COMPONENT ---


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
      >
        <FlatList
          data={comments}
          renderItem={({ item }) => <CommentItem comment={item} />}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={ReportHeaderComponent}
          // The paddingBottom handles space for the KeyboardAvoidingView offset
          contentContainerStyle={{ paddingBottom: 10 }}
        />
        
        {/* COMMENT INPUT BAR */}
        <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom || 10 }]}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={DARK_COLORS.SECONDARY_TEXT}
            value={newComment}
            onChangeText={setNewComment}
            autoCorrect={true}
            editable={!isLoadingComments}
          />
          <TouchableOpacity onPress={handlePostComment} style={styles.commentButton} disabled={!newComment.trim()}>
            <Ionicons name="send" size={20} color={newComment.trim() ? DARK_COLORS.PRIMARY : DARK_COLORS.SECONDARY_TEXT} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
  },
  // We no longer need the scrollView style here as we use FlatList
  fullImage: {
    width: width,
    height: width * 0.6,
  },
  audioPlaceholder: {
    width: width,
    backgroundColor: DARK_COLORS.CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioOnly: {
    height: width * 0.6,
    borderBottomWidth: 1,
    borderBottomColor: DARK_COLORS.BORDER,
  },
  audioWithImage: {
    height: 'auto', 
    paddingVertical: 30,
    borderTopWidth: 1, 
    borderTopColor: DARK_COLORS.BORDER,
  },
  audioText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_COLORS.PRIMARY,
    marginTop: 10,
  },
  audioSubText: {
    fontSize: 12,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginTop: 5,
  },
  content: {
    paddingHorizontal: 15, // Change from padding to paddingHorizontal
  },
  issueType: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DARK_COLORS.TEXT,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: DARK_COLORS.BORDER,
    paddingBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: DARK_COLORS.BACKGROUND,
  },
  detailCard: {
    backgroundColor: DARK_COLORS.CARD,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: DARK_COLORS.PRIMARY,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK_COLORS.TEXT,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: DARK_COLORS.SECONDARY_TEXT,
    lineHeight: 24,
  },
  subDetailText: {
    fontSize: 13,
    color: DARK_COLORS.SECONDARY_TEXT,
    marginTop: 5,
  },
  // --- NEW COMMENT STYLES ---
  commentContainer: {
    backgroundColor: DARK_COLORS.CARD,
    padding: 12,
    marginHorizontal: 15, // Match paddingHorizontal of content
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DARK_COLORS.BORDER,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK_COLORS.PRIMARY,
  },
  commentDate: {
    fontSize: 12,
    color: DARK_COLORS.SECONDARY_TEXT,
    fontWeight: 'normal',
    lineHeight: 18, // Align vertically with user name
  },
  commentText: {
    fontSize: 15,
    color: DARK_COLORS.TEXT,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: DARK_COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: DARK_COLORS.BORDER,
  },
  commentInput: {
    flex: 1,
    backgroundColor: DARK_COLORS.BACKGROUND,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: DARK_COLORS.TEXT,
    marginRight: 10,
  },
  commentButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
});

export default ReportDetailScreen;