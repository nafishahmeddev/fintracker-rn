import { TransactionFilters } from '@/src/features/transactions/api/transactions';

export interface AdvancedFilters {
  // Date range
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  
  // Multi-select accounts
  accountIds?: number[];
  
  // Multi-select categories
  categoryIds?: number[];
  
  // Transaction types (can select multiple: ['CR', 'DR'] or single)
  types?: ('CR' | 'DR')[];
  
  // Amount range
  amountRange?: {
    min?: number;
    max?: number;
  };
  
  // Search in notes
  searchQuery?: string;
  
  // Sort order
  sortBy: 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  sortBy: 'date',
  sortOrder: 'desc',
};

export class AdvancedFilterService {
  /**
   * Convert advanced filters to basic TransactionFilters for API
   */
  static toBasicFilters(advanced: AdvancedFilters): TransactionFilters {
    const basic: TransactionFilters = {};
    
    // Type filter (use first if single, API only supports single)
    if (advanced.types && advanced.types.length === 1) {
      basic.type = advanced.types[0];
    }
    
    // Account filter (use first if single, API only supports single)
    if (advanced.accountIds && advanced.accountIds.length === 1) {
      basic.accountId = advanced.accountIds[0];
    }
    
    // Category filter (use first if single, API only supports single)
    if (advanced.categoryIds && advanced.categoryIds.length === 1) {
      basic.categoryId = advanced.categoryIds[0];
    }
    
    return basic;
  }
  
  /**
   * Check if advanced filters have multi-select that requires client-side filtering
   */
  static requiresClientSideFiltering(advanced: AdvancedFilters): boolean {
    // Check for multi-select that API doesn't support
    const hasMultipleTypes = (advanced.types?.length || 0) > 1;
    const hasMultipleAccounts = (advanced.accountIds?.length || 0) > 1;
    const hasMultipleCategories = (advanced.categoryIds?.length || 0) > 1;
    const hasDateRange = !!advanced.dateRange;
    const hasAmountRange = !!advanced.amountRange;
    const hasSearchQuery = !!advanced.searchQuery?.trim();
    
    return hasMultipleTypes || 
           hasMultipleAccounts || 
           hasMultipleCategories || 
           hasDateRange || 
           hasAmountRange || 
           hasSearchQuery;
  }
  
  /**
   * Count active filters
   */
  static countActiveFilters(advanced: AdvancedFilters): number {
    let count = 0;
    
    if (advanced.dateRange) count++;
    if (advanced.accountIds && advanced.accountIds.length > 0) count++;
    if (advanced.categoryIds && advanced.categoryIds.length > 0) count++;
    if (advanced.types && advanced.types.length > 0) count++;
    if (advanced.amountRange && (advanced.amountRange.min !== undefined || advanced.amountRange.max !== undefined)) count++;
    if (advanced.searchQuery?.trim()) count++;
    
    return count;
  }
  
  /**
   * Check if any filters are active
   */
  static hasActiveFilters(advanced: AdvancedFilters): boolean {
    return this.countActiveFilters(advanced) > 0;
  }
  
  /**
   * Get a summary string of active filters
   */
  static getFilterSummary(advanced: AdvancedFilters): string {
    const parts: string[] = [];
    
    if (advanced.dateRange) {
      parts.push('Date range');
    }
    
    if (advanced.accountIds && advanced.accountIds.length > 0) {
      parts.push(`${advanced.accountIds.length} account${advanced.accountIds.length > 1 ? 's' : ''}`);
    }
    
    if (advanced.categoryIds && advanced.categoryIds.length > 0) {
      parts.push(`${advanced.categoryIds.length} categor${advanced.categoryIds.length > 1 ? 'ies' : 'y'}`);
    }
    
    if (advanced.types && advanced.types.length > 0) {
      const typeLabels = advanced.types.map(t => t === 'CR' ? 'Income' : 'Expense');
      parts.push(typeLabels.join(' & '));
    }
    
    if (advanced.searchQuery?.trim()) {
      parts.push('Search');
    }
    
    return parts.join(', ') || 'No filters';
  }
}
