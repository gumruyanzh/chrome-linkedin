// Response Tracking and Follow-up System for LinkedIn Automation

import { getStorageData, setStorageData, logAnalytics, STORAGE_KEYS } from './storage.js';

/**
 * Response types
 */
export const RESPONSE_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  QUESTION: 'question',
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested',
  OUT_OF_OFFICE: 'out_of_office',
  MEETING_REQUEST: 'meeting_request'
};

/**
 * Follow-up types
 */
export const FOLLOWUP_TYPES = {
  THANK_YOU: 'thank_you',
  REMINDER: 'reminder',
  VALUE_ADD: 'value_add',
  MEETING_REQUEST: 'meeting_request',
  CONTENT_SHARE: 'content_share',
  CHECK_IN: 'check_in',
  NURTURE: 'nurture'
};

/**
 * Follow-up status
 */
export const FOLLOWUP_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  DELIVERED: 'delivered',
  RESPONDED: 'responded',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Response Tracking and Follow-up System
 */
export class ResponseTrackingSystem {
  constructor() {
    this.conversations = new Map();
    this.followupSequences = new Map();
    this.responseTemplates = new Map();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.init();
  }

  async init() {
    try {
      await this.loadConversations();
      await this.loadFollowupSequences();
      await this.loadResponseTemplates();
      this.startResponseDetector();
    } catch (error) {
      console.error('Error initializing response tracking system:', error);
    }
  }

  /**
   * Track a new message sent to a connection
   * @param {Object} messageData - Message data
   * @returns {Promise<string>} Conversation ID
   */
  async trackSentMessage(messageData) {
    try {
      const conversationId = this.generateConversationId(messageData.profileId);
      let conversation = this.conversations.get(conversationId);

      if (!conversation) {
        conversation = {
          id: conversationId,
          profileId: messageData.profileId,
          profileName: messageData.profileName,
          profileUrl: messageData.profileUrl,
          startedAt: Date.now(),
          lastActivity: Date.now(),
          status: 'active',
          messages: [],
          sentiment: 'neutral',
          responseRate: 0,
          averageResponseTime: 0,
          followups: [],
          tags: [],
          notes: ''
        };
      }

      const message = {
        id: this.generateMessageId(),
        type: 'sent',
        content: messageData.content,
        timestamp: Date.now(),
        templateId: messageData.templateId || null,
        campaignId: messageData.campaignId || null,
        read: false,
        responded: false
      };

      conversation.messages.push(message);
      conversation.lastActivity = Date.now();
      this.conversations.set(conversationId, conversation);

      await this.saveConversations();

      // Schedule automatic follow-up detection
      await this.scheduleResponseCheck(conversationId, message.id);

      await logAnalytics({
        type: 'message_sent_tracked',
        conversationId,
        profileId: messageData.profileId,
        messageId: message.id,
        templateId: messageData.templateId
      });

      return conversationId;
    } catch (error) {
      console.error('Error tracking sent message:', error);
      throw new Error(`Failed to track sent message: ${error.message}`);
    }
  }

  /**
   * Detect and process incoming response
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>} Processing result
   */
  async detectResponse(responseData) {
    try {
      const conversationId = this.generateConversationId(responseData.profileId);
      const conversation = this.conversations.get(conversationId);

      if (!conversation) {
        // Create new conversation if response comes before we tracked sent message
        await this.trackSentMessage({
          profileId: responseData.profileId,
          profileName: responseData.profileName,
          profileUrl: responseData.profileUrl,
          content: '[Previous message]'
        });
      }

      const response = {
        id: this.generateMessageId(),
        type: 'received',
        content: responseData.content,
        timestamp: responseData.timestamp || Date.now(),
        read: true,
        sentiment: await this.analyzeSentiment(responseData.content),
        responseType: await this.classifyResponse(responseData.content),
        keywords: this.extractKeywords(responseData.content)
      };

      // Update conversation
      conversation.messages.push(response);
      conversation.lastActivity = response.timestamp;
      conversation.sentiment = response.sentiment;

      // Update response metrics
      await this.updateResponseMetrics(conversation, response);

      // Mark previous sent messages as responded
      this.markMessagesAsResponded(conversation, response.timestamp);

      // Cancel pending follow-ups if response is positive
      if (
        response.responseType === RESPONSE_TYPES.POSITIVE ||
        response.responseType === RESPONSE_TYPES.INTERESTED
      ) {
        await this.cancelPendingFollowups(conversationId);
      }

      // Suggest follow-up actions
      const followupSuggestions = await this.suggestFollowupActions(conversation, response);

      this.conversations.set(conversationId, conversation);
      await this.saveConversations();

      await logAnalytics({
        type: 'response_detected',
        conversationId,
        profileId: responseData.profileId,
        responseType: response.responseType,
        sentiment: response.sentiment,
        responseTime: this.calculateResponseTime(conversation, response)
      });

      return {
        conversationId,
        response,
        conversation,
        followupSuggestions,
        responseTime: this.calculateResponseTime(conversation, response)
      };
    } catch (error) {
      console.error('Error detecting response:', error);
      throw new Error(`Failed to detect response: ${error.message}`);
    }
  }

  /**
   * Create a follow-up sequence
   * @param {Object} sequenceConfig - Sequence configuration
   * @returns {Promise<Object>} Created sequence
   */
  async createFollowupSequence(sequenceConfig) {
    try {
      const sequence = {
        id: this.generateSequenceId(),
        name: sequenceConfig.name,
        description: sequenceConfig.description || '',
        trigger: sequenceConfig.trigger, // 'no_response', 'positive_response', 'question', etc.
        delay: sequenceConfig.delay || 24 * 60 * 60 * 1000, // 24 hours default
        steps: this.validateSequenceSteps(sequenceConfig.steps),
        isActive: sequenceConfig.isActive !== false,
        conditions: sequenceConfig.conditions || {},
        createdAt: Date.now(),
        usage: {
          triggered: 0,
          completed: 0,
          responseRate: 0
        }
      };

      this.followupSequences.set(sequence.id, sequence);
      await this.saveFollowupSequences();

      return sequence;
    } catch (error) {
      console.error('Error creating follow-up sequence:', error);
      throw new Error(`Failed to create follow-up sequence: ${error.message}`);
    }
  }

  /**
   * Schedule a follow-up message
   * @param {Object} followupConfig - Follow-up configuration
   * @returns {Promise<Object>} Scheduled follow-up
   */
  async scheduleFollowup(followupConfig) {
    try {
      const followup = {
        id: this.generateFollowupId(),
        conversationId: followupConfig.conversationId,
        type: followupConfig.type,
        content: followupConfig.content,
        templateId: followupConfig.templateId || null,
        sequenceId: followupConfig.sequenceId || null,
        stepNumber: followupConfig.stepNumber || 1,
        scheduledFor: followupConfig.scheduledFor,
        status: FOLLOWUP_STATUS.SCHEDULED,
        createdAt: Date.now(),
        sentAt: null,
        responseReceived: false,
        metadata: followupConfig.metadata || {}
      };

      // Add to conversation
      const conversation = this.conversations.get(followupConfig.conversationId);
      if (conversation) {
        conversation.followups.push(followup);
        this.conversations.set(followupConfig.conversationId, conversation);
      }

      await this.saveConversations();

      // Schedule execution
      await this.scheduleFollowupExecution(followup);

      await logAnalytics({
        type: 'followup_scheduled',
        conversationId: followupConfig.conversationId,
        followupId: followup.id,
        type: followup.type,
        scheduledFor: followup.scheduledFor
      });

      return followup;
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      throw new Error(`Failed to schedule follow-up: ${error.message}`);
    }
  }

  /**
   * Execute a scheduled follow-up
   * @param {string} followupId - Follow-up ID
   * @returns {Promise<Object>} Execution result
   */
  async executeFollowup(followupId) {
    try {
      const conversation = this.findConversationByFollowupId(followupId);
      if (!conversation) {
        throw new Error('Conversation not found for follow-up');
      }

      const followup = conversation.followups.find(f => f.id === followupId);
      if (!followup) {
        throw new Error('Follow-up not found');
      }

      if (followup.status !== FOLLOWUP_STATUS.SCHEDULED) {
        throw new Error(`Follow-up is not scheduled (status: ${followup.status})`);
      }

      // Check if conditions are still met
      if (!(await this.checkFollowupConditions(followup, conversation))) {
        followup.status = FOLLOWUP_STATUS.CANCELLED;
        await this.saveConversations();
        return { status: 'cancelled', reason: 'conditions_not_met' };
      }

      // Send the follow-up message
      const sendResult = await this.sendFollowupMessage(followup, conversation);

      if (sendResult.success) {
        followup.status = FOLLOWUP_STATUS.SENT;
        followup.sentAt = Date.now();

        // Add message to conversation
        const message = {
          id: this.generateMessageId(),
          type: 'sent',
          content: followup.content,
          timestamp: Date.now(),
          followupId: followup.id,
          templateId: followup.templateId
        };

        conversation.messages.push(message);
        conversation.lastActivity = Date.now();

        await this.saveConversations();

        // Schedule next follow-up in sequence if applicable
        await this.scheduleNextInSequence(followup, conversation);

        await logAnalytics({
          type: 'followup_sent',
          conversationId: conversation.id,
          followupId: followup.id,
          type: followup.type,
          sequenceId: followup.sequenceId
        });

        return { status: 'sent', followup, message };
      } else {
        followup.status = FOLLOWUP_STATUS.FAILED;
        await this.saveConversations();
        return { status: 'failed', error: sendResult.error };
      }
    } catch (error) {
      console.error('Error executing follow-up:', error);
      throw new Error(`Failed to execute follow-up: ${error.message}`);
    }
  }

  /**
   * Analyze conversation sentiment and engagement
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeConversation(conversationId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const analysis = {
        conversationId,
        metrics: {
          messageCount: conversation.messages.length,
          responseCount: conversation.messages.filter(m => m.type === 'received').length,
          responseRate: this.calculateConversationResponseRate(conversation),
          averageResponseTime: conversation.averageResponseTime,
          lastActivity: conversation.lastActivity,
          conversationLength: Date.now() - conversation.startedAt
        },
        sentiment: {
          overall: conversation.sentiment,
          trend: this.calculateSentimentTrend(conversation),
          distribution: this.calculateSentimentDistribution(conversation)
        },
        engagement: {
          level: this.calculateEngagementLevel(conversation),
          score: this.calculateEngagementScore(conversation),
          indicators: this.getEngagementIndicators(conversation)
        },
        followups: {
          scheduled: conversation.followups.filter(f => f.status === FOLLOWUP_STATUS.SCHEDULED)
            .length,
          sent: conversation.followups.filter(f => f.status === FOLLOWUP_STATUS.SENT).length,
          responded: conversation.followups.filter(f => f.responseReceived).length
        },
        recommendations: await this.generateConversationRecommendations(conversation)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      throw new Error(`Failed to analyze conversation: ${error.message}`);
    }
  }

  /**
   * Get conversations with filtering and pagination
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} Conversations list
   */
  async getConversations(options = {}) {
    try {
      let conversations = Array.from(this.conversations.values());

      // Apply filters
      if (options.status) {
        conversations = conversations.filter(c => c.status === options.status);
      }

      if (options.sentiment) {
        conversations = conversations.filter(c => c.sentiment === options.sentiment);
      }

      if (options.hasResponse) {
        conversations = conversations.filter(c => c.messages.some(m => m.type === 'received'));
      }

      if (options.responseType) {
        conversations = conversations.filter(c =>
          c.messages.some(m => m.responseType === options.responseType)
        );
      }

      if (options.lastActivityAfter) {
        conversations = conversations.filter(c => c.lastActivity >= options.lastActivityAfter);
      }

      if (options.tags && options.tags.length > 0) {
        conversations = conversations.filter(c => options.tags.some(tag => c.tags.includes(tag)));
      }

      // Sort conversations
      const sortBy = options.sortBy || 'lastActivity';
      const sortOrder = options.sortOrder || 'desc';

      conversations.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (sortOrder === 'desc') {
          return bValue - aValue;
        } else {
          return aValue - bValue;
        }
      });

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        conversations: conversations.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: conversations.length,
          totalPages: Math.ceil(conversations.length / limit)
        },
        summary: {
          total: this.conversations.size,
          withResponses: Array.from(this.conversations.values()).filter(c =>
            c.messages.some(m => m.type === 'received')
          ).length,
          averageResponseRate: this.calculateOverallResponseRate()
        }
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        conversations: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        summary: { total: 0, withResponses: 0, averageResponseRate: 0 }
      };
    }
  }

  /**
   * Helper methods
   */

  generateConversationId(profileId) {
    return `conv_${profileId}`;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSequenceId() {
    return `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFollowupId() {
    return `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async analyzeSentiment(content) {
    return await this.sentimentAnalyzer.analyze(content);
  }

  async classifyResponse(content) {
    // Simple classification logic
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes('yes') ||
      lowerContent.includes('interested') ||
      lowerContent.includes('sounds good') ||
      lowerContent.includes("let's")
    ) {
      return RESPONSE_TYPES.INTERESTED;
    }

    if (
      lowerContent.includes('no') ||
      lowerContent.includes('not interested') ||
      lowerContent.includes('decline') ||
      lowerContent.includes('pass')
    ) {
      return RESPONSE_TYPES.NOT_INTERESTED;
    }

    if (
      lowerContent.includes('?') ||
      lowerContent.includes('what') ||
      lowerContent.includes('how') ||
      lowerContent.includes('when')
    ) {
      return RESPONSE_TYPES.QUESTION;
    }

    if (
      lowerContent.includes('meeting') ||
      lowerContent.includes('call') ||
      lowerContent.includes('schedule') ||
      lowerContent.includes('available')
    ) {
      return RESPONSE_TYPES.MEETING_REQUEST;
    }

    if (
      lowerContent.includes('out of office') ||
      lowerContent.includes('vacation') ||
      lowerContent.includes('away')
    ) {
      return RESPONSE_TYPES.OUT_OF_OFFICE;
    }

    return RESPONSE_TYPES.NEUTRAL;
  }

  extractKeywords(content) {
    // Simple keyword extraction
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const commonWords = [
      'that',
      'this',
      'with',
      'from',
      'they',
      'been',
      'have',
      'were',
      'said',
      'each',
      'which',
      'their',
      'time',
      'will',
      'about',
      'would',
      'there',
      'could',
      'other'
    ];

    return words.filter(word => !commonWords.includes(word)).slice(0, 10);
  }

  calculateResponseTime(conversation, response) {
    const sentMessages = conversation.messages
      .filter(m => m.type === 'sent' && m.timestamp < response.timestamp)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (sentMessages.length === 0) {
      return 0;
    }

    return response.timestamp - sentMessages[0].timestamp;
  }

  updateResponseMetrics(conversation, response) {
    const responseTimes = [];

    conversation.messages.forEach((message, index) => {
      if (message.type === 'received' && index > 0) {
        const previousSent = [...conversation.messages]
          .slice(0, index)
          .reverse()
          .find(m => m.type === 'sent');

        if (previousSent) {
          responseTimes.push(message.timestamp - previousSent.timestamp);
        }
      }
    });

    if (responseTimes.length > 0) {
      conversation.averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    const totalResponses = conversation.messages.filter(m => m.type === 'received').length;
    const totalSent = conversation.messages.filter(m => m.type === 'sent').length;
    conversation.responseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0;
  }

  markMessagesAsResponded(conversation, responseTimestamp) {
    conversation.messages.forEach(message => {
      if (message.type === 'sent' && message.timestamp < responseTimestamp && !message.responded) {
        message.responded = true;
      }
    });
  }

  validateSequenceSteps(steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Sequence must have at least one step');
    }

    return steps.map((step, index) => ({
      stepNumber: index + 1,
      type: step.type || FOLLOWUP_TYPES.REMINDER,
      delay: step.delay || 24 * 60 * 60 * 1000, // 24 hours
      template: step.template,
      conditions: step.conditions || {}
    }));
  }

  async scheduleResponseCheck(conversationId, messageId) {
    // Schedule automatic response detection after 1 hour
    setTimeout(
      async () => {
        try {
          await this.checkForResponse(conversationId, messageId);
        } catch (error) {
          console.error('Error in scheduled response check:', error);
        }
      },
      60 * 60 * 1000
    ); // 1 hour
  }

  async checkForResponse(conversationId, messageId) {
    // This would integrate with LinkedIn message detection
    // For now, it's a placeholder
    console.log(`Checking for response to message ${messageId} in conversation ${conversationId}`);
  }

  async suggestFollowupActions(conversation, response) {
    const suggestions = [];

    switch (response.responseType) {
      case RESPONSE_TYPES.INTERESTED:
        suggestions.push({
          type: FOLLOWUP_TYPES.MEETING_REQUEST,
          priority: 'high',
          template: 'meeting_request',
          delay: 2 * 60 * 60 * 1000 // 2 hours
        });
        break;

      case RESPONSE_TYPES.QUESTION:
        suggestions.push({
          type: FOLLOWUP_TYPES.VALUE_ADD,
          priority: 'high',
          template: 'question_response',
          delay: 30 * 60 * 1000 // 30 minutes
        });
        break;

      case RESPONSE_TYPES.OUT_OF_OFFICE:
        suggestions.push({
          type: FOLLOWUP_TYPES.CHECK_IN,
          priority: 'low',
          template: 'check_in',
          delay: 7 * 24 * 60 * 60 * 1000 // 1 week
        });
        break;

      case RESPONSE_TYPES.NOT_INTERESTED:
        suggestions.push({
          type: FOLLOWUP_TYPES.NURTURE,
          priority: 'low',
          template: 'nurture',
          delay: 30 * 24 * 60 * 60 * 1000 // 1 month
        });
        break;

      default:
        suggestions.push({
          type: FOLLOWUP_TYPES.VALUE_ADD,
          priority: 'medium',
          template: 'value_add',
          delay: 24 * 60 * 60 * 1000 // 1 day
        });
    }

    return suggestions;
  }

  findConversationByFollowupId(followupId) {
    for (const conversation of this.conversations.values()) {
      if (conversation.followups.some(f => f.id === followupId)) {
        return conversation;
      }
    }
    return null;
  }

  async checkFollowupConditions(followup, conversation) {
    // Check if conversation still warrants follow-up
    const hasRecentResponse = conversation.messages.some(
      m => m.type === 'received' && m.timestamp > followup.createdAt
    );

    // Don't send follow-up if we received a response
    if (hasRecentResponse) {
      return false;
    }

    // Check other conditions
    if (followup.metadata.conditions) {
      // Implement custom condition checking
    }

    return true;
  }

  async sendFollowupMessage(followup, conversation) {
    try {
      // This would integrate with LinkedIn messaging API
      // For now, simulate sending
      console.log(`Sending follow-up message to ${conversation.profileId}`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async scheduleNextInSequence(followup, conversation) {
    if (!followup.sequenceId) {
      return;
    }

    const sequence = this.followupSequences.get(followup.sequenceId);
    if (!sequence) {
      return;
    }

    const nextStep = sequence.steps.find(step => step.stepNumber === followup.stepNumber + 1);
    if (!nextStep) {
      return;
    }

    await this.scheduleFollowup({
      conversationId: conversation.id,
      type: nextStep.type,
      content: nextStep.template,
      templateId: nextStep.template,
      sequenceId: sequence.id,
      stepNumber: nextStep.stepNumber,
      scheduledFor: Date.now() + nextStep.delay
    });
  }

  async cancelPendingFollowups(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return;
    }

    conversation.followups.forEach(followup => {
      if (followup.status === FOLLOWUP_STATUS.SCHEDULED) {
        followup.status = FOLLOWUP_STATUS.CANCELLED;
      }
    });

    await this.saveConversations();
  }

  calculateConversationResponseRate(conversation) {
    const sentCount = conversation.messages.filter(m => m.type === 'sent').length;
    const receivedCount = conversation.messages.filter(m => m.type === 'received').length;

    return sentCount > 0 ? (receivedCount / sentCount) * 100 : 0;
  }

  calculateOverallResponseRate() {
    const conversations = Array.from(this.conversations.values());
    if (conversations.length === 0) {
      return 0;
    }

    const totalResponseRate = conversations.reduce((sum, conv) => sum + conv.responseRate, 0);
    return totalResponseRate / conversations.length;
  }

  async saveConversations() {
    const conversations = Object.fromEntries(this.conversations);
    await setStorageData({ [STORAGE_KEYS.CONVERSATIONS]: conversations });
  }

  async loadConversations() {
    try {
      const result = await getStorageData(STORAGE_KEYS.CONVERSATIONS);
      const conversations = result.conversations || {};

      Object.entries(conversations).forEach(([id, conversation]) => {
        this.conversations.set(id, conversation);
      });
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  async saveFollowupSequences() {
    const sequences = Object.fromEntries(this.followupSequences);
    await setStorageData({ [STORAGE_KEYS.FOLLOWUP_SEQUENCES]: sequences });
  }

  async loadFollowupSequences() {
    try {
      const result = await getStorageData(STORAGE_KEYS.FOLLOWUP_SEQUENCES);
      const sequences = result.followup_sequences || {};

      Object.entries(sequences).forEach(([id, sequence]) => {
        this.followupSequences.set(id, sequence);
      });
    } catch (error) {
      console.error('Error loading follow-up sequences:', error);
    }
  }

  async saveResponseTemplates() {
    const templates = Object.fromEntries(this.responseTemplates);
    await setStorageData({ [STORAGE_KEYS.RESPONSE_TEMPLATES]: templates });
  }

  async loadResponseTemplates() {
    try {
      const result = await getStorageData(STORAGE_KEYS.RESPONSE_TEMPLATES);
      const templates = result.response_templates || {};

      Object.entries(templates).forEach(([id, template]) => {
        this.responseTemplates.set(id, template);
      });
    } catch (error) {
      console.error('Error loading response templates:', error);
    }
  }

  startResponseDetector() {
    // Start periodic checking for new responses
    setInterval(
      () => {
        this.scanForNewResponses();
      },
      5 * 60 * 1000
    ); // Check every 5 minutes
  }

  async scanForNewResponses() {
    // This would scan LinkedIn for new messages
    // Implementation would depend on LinkedIn's DOM structure
    console.log('Scanning for new responses...');
  }
}

/**
 * Simple sentiment analyzer
 */
class SentimentAnalyzer {
  constructor() {
    this.positiveWords = [
      'great',
      'excellent',
      'awesome',
      'love',
      'amazing',
      'perfect',
      'wonderful',
      'fantastic',
      'yes',
      'absolutely',
      'definitely',
      'interested',
      'excited'
    ];
    this.negativeWords = [
      'terrible',
      'awful',
      'hate',
      'horrible',
      'worst',
      'bad',
      'no',
      'never',
      'decline',
      'reject',
      'uninterested',
      'busy',
      'not interested'
    ];
  }

  async analyze(text) {
    const words = text.toLowerCase().split(/\s+/);

    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach(word => {
      if (this.positiveWords.includes(word)) {
        positiveScore++;
      }
      if (this.negativeWords.includes(word)) {
        negativeScore++;
      }
    });

    if (positiveScore > negativeScore) {
      return 'positive';
    }
    if (negativeScore > positiveScore) {
      return 'negative';
    }
    return 'neutral';
  }
}

/**
 * Create response tracking system instance
 * @returns {ResponseTrackingSystem} Response tracking system instance
 */
export function createResponseTrackingSystem() {
  return new ResponseTrackingSystem();
}
