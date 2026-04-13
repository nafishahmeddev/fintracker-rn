/**
 * Core Type Definitions for Luno
 * Centralizing types ensures consistency across DB, API, and UI layers.
 */

/**
 * TransactionType: Represents the nature of a financial movement.
 * CR = Credit (Income / Inflow)
 * DR = Debit (Expense / Outflow)
 */
export type TransactionType = 'CR' | 'DR';

/**
 * TrendMode: Dictates how a percentage change should be visually interpreted.
 */
export type TrendMode = 'high_is_good' | 'low_is_good' | 'neutral';

/**
 * InsightStatus: Determines the visual style of a dashboard insight card.
 */
export type InsightStatus = 'success' | 'danger' | 'info' | 'warning';

/**
 * InsightTrend: Indicates the direction of a metric change.
 */
export type InsightTrend = 'up' | 'down' | 'neutral';
