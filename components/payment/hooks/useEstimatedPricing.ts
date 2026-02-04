'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ComfortPlanProduct,
  ComfortPlanOption,
  transformToComfortPlanOptions,
} from '../types';

interface UseEstimatedPricingOptions {
  state: string;
  totalFinancedAmount: number;
  enabled?: boolean;
}

interface UseEstimatedPricingResult {
  products: ComfortPlanProduct[];
  options: ComfortPlanOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple cache to avoid redundant API calls
const pricingCache = new Map<string, { products: ComfortPlanProduct[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(state: string, amount: number): string {
  // Round amount to nearest $100 for better cache hits
  const roundedAmount = Math.round(amount / 100) * 100;
  return `${state}-${roundedAmount}`;
}

export function useEstimatedPricing({
  state,
  totalFinancedAmount,
  enabled = true,
}: UseEstimatedPricingOptions): UseEstimatedPricingResult {
  const [products, setProducts] = useState<ComfortPlanProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the last fetched params to avoid duplicate fetches
  const lastFetchRef = useRef<string | null>(null);

  const fetchPricing = useCallback(async () => {
    if (!state || state.length !== 2 || totalFinancedAmount <= 0) {
      setProducts([]);
      setError(null);
      return;
    }

    const cacheKey = getCacheKey(state, totalFinancedAmount);

    // Check cache first
    const cached = pricingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setProducts(cached.products);
      setError(null);
      return;
    }

    // Prevent duplicate fetches for the same params
    if (lastFetchRef.current === cacheKey && isLoading) {
      return;
    }

    lastFetchRef.current = cacheKey;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/finance/lightreach/estimated-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: state.toUpperCase(),
          totalFinancedAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === 'CREDENTIALS_REQUIRED') {
          setError('LightReach integration is not configured');
        } else {
          setError(data.error || 'Failed to fetch pricing');
        }
        setProducts([]);
        return;
      }

      const fetchedProducts = data.products || [];
      setProducts(fetchedProducts);

      // Cache the result
      pricingCache.set(cacheKey, {
        products: fetchedProducts,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Error fetching estimated pricing:', err);
      setError('Unable to fetch pricing. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [state, totalFinancedAmount, isLoading]);

  // Auto-fetch when params change and enabled
  useEffect(() => {
    if (enabled && state && totalFinancedAmount > 0) {
      fetchPricing();
    }
  }, [enabled, state, totalFinancedAmount, fetchPricing]);

  // Transform products to options
  const options = transformToComfortPlanOptions(products);

  return {
    products,
    options,
    isLoading,
    error,
    refetch: fetchPricing,
  };
}

// Export a function to clear the cache if needed
export function clearPricingCache(): void {
  pricingCache.clear();
}
