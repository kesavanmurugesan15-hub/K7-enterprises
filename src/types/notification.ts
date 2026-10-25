export type NotificationType =
  | 'ORDER_NEW'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_APPROVAL_REQUIRED'
  | 'PAYMENT_RECEIVED'
  | 'LOW_STOCK_ALERT'
  | 'NEAR_EXPIRY_ALERT'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'RECONCILIATION_PENDING'
  | 'SYSTEM_ALERT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  targetRole?: string;
  targetUserId?: string;
  linkToTab?: string;
  relatedEntityId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: 'CATALOGUE' | 'ORDERS' | 'INVENTORY' | 'PURCHASE' | 'ACCOUNTING' | 'USERS' | 'BANK_REC' | 'CREDIT' | 'BUSINESS';
  entityId: string;
  entityName: string;
  details: string;
  ipAddress?: string;
}
