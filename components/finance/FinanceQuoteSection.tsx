"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";

interface Quote {
  id: string;
  accountId?: string;
  productId: string;
  externalReference?: string;
  type: "lease" | "ppa";
  totalSystemCost: number;
  productName?: string;
  escalationRate?: number;
  systemPricingDetails: Array<{
    year: number;
    monthlyPayment: number;
    yearlyCost: number;
  }>;
  totalAmountPaid: number;
  status: "active" | "contracted" | "voided";
  contractId?: string;
}

interface PricingProduct {
  productId: string;
  name: string;
  type: string;
  escalationRate?: number;
  termYears?: number;
  monthlyPayments: Array<{
    year: number;
    monthlyPayment: number;
    yearlyCost?: number;
  }>;
  totalAmountPaid?: number;
}

interface FinanceQuoteSectionProps {
  accountId: string;
  totalSystemCost: number;
  state: string;
  onQuoteCreated?: (quote: Quote) => void;
}

export function FinanceQuoteSection({
  accountId,
  totalSystemCost,
  state,
  onQuoteCreated,
}: FinanceQuoteSectionProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pricingProducts, setPricingProducts] = useState<PricingProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [voiding, setVoiding] = useState<string | null>(null);

  // Load existing quotes
  useEffect(() => {
    async function loadQuotes() {
      try {
        const res = await fetch(`/api/finance/lightreach/quote/${accountId}`);
        if (res.ok) {
          const data = await res.json();
          setQuotes(data.quotes || []);
        }
      } catch (err) {
        console.warn("Failed to load quotes:", err);
      } finally {
        setLoading(false);
      }
    }
    if (accountId) {
      loadQuotes();
    }
  }, [accountId]);

  // Load pricing products
  const loadPricing = async () => {
    setLoadingPricing(true);
    try {
      const res = await fetch("/api/finance/lightreach/estimated-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          totalFinancedAmount: totalSystemCost,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load pricing");
      }

      const data = await res.json();
      setPricingProducts(data.products || []);
      if (data.products?.length > 0) {
        setSelectedProductId(data.products[0].productId);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load pricing",
      );
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedProductId) {
      toast.error("Please select a pricing product");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/finance/lightreach/quote/${accountId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          totalFinancedAmount: totalSystemCost,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create quote");
      }

      const data = await res.json();
      setQuotes([...quotes, data.quote]);
      onQuoteCreated?.(data.quote);
      toast.success("Quote created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create quote",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleVoidQuote = async (quoteId: string) => {
    setVoiding(quoteId);
    try {
      const res = await fetch(
        `/api/finance/lightreach/quote/${accountId}?quoteId=${quoteId}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to void quote");
      }

      setQuotes(
        quotes.map((q) => (q.id === quoteId ? { ...q, status: "voided" } : q)),
      );
      toast.success("Quote voided");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to void quote");
    } finally {
      setVoiding(null);
    }
  };

  const getStatusBadge = (status: Quote["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="size-3" />
            Active
          </Badge>
        );
      case "contracted":
        return (
          <Badge variant="secondary" className="gap-1">
            <FileText className="size-3" />
            Contracted
          </Badge>
        );
      case "voided":
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <XCircle className="size-3" />
            Voided
          </Badge>
        );
    }
  };

  const selectedProduct = pricingProducts.find(
    (p) => p.productId === selectedProductId,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-5" />
            <CardTitle>Quotes</CardTitle>
          </div>
          {loading && <Spinner className="size-4" />}
        </div>
        <CardDescription>
          Create and manage financing quotes for this account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Quotes */}
        {quotes.length > 0 && (
          <div className="space-y-3">
            <Label>Existing Quotes</Label>
            {quotes.map((quote) => (
              <div key={quote.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(quote.status)}
                    <span className="text-sm font-medium">
                      {quote.productName || "Comfort Plan"}
                    </span>
                  </div>
                  {quote.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVoidQuote(quote.id)}
                      disabled={voiding === quote.id}
                    >
                      {voiding === quote.id ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Trash2 className="size-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">System Cost</p>
                    <p className="font-medium">
                      ${quote.totalSystemCost.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      Monthly Payment (Yr 1)
                    </p>
                    <p className="font-medium">
                      $
                      {quote.systemPricingDetails[0]?.monthlyPayment.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Escalator</p>
                    <p className="font-medium">
                      {quote.escalationRate === 0
                        ? "0% (Fixed)"
                        : `${quote.escalationRate}%`}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Quote ID: {quote.id.slice(0, 12)}...
                  {quote.contractId && (
                    <span> | Contract: {quote.contractId.slice(0, 12)}...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create New Quote */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Create New Quote</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPricing}
              disabled={loadingPricing}
            >
              {loadingPricing ? (
                <Spinner className="size-4 mr-1" />
              ) : (
                <RefreshCw className="size-4 mr-1" />
              )}
              Load Pricing Options
            </Button>
          </div>

          {pricingProducts.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Select Pricing Product</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingProducts.map((product) => (
                      <SelectItem
                        key={product.productId}
                        value={product.productId}
                      >
                        <div className="flex items-center gap-2">
                          <span>{product.name}</span>
                          <Badge variant="outline" className="text-xs">
                            $
                            {product.monthlyPayments[0]?.monthlyPayment.toFixed(
                              2,
                            )}
                            /mo
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-4 text-muted-foreground" />
                    <span className="font-medium">{selectedProduct.name}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Monthly (Year 1)</p>
                      <p className="text-lg font-bold">
                        $
                        {selectedProduct.monthlyPayments[0]?.monthlyPayment.toFixed(
                          2,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Term</p>
                      <p className="font-medium">
                        {selectedProduct.termYears ||
                          selectedProduct.monthlyPayments.length}{" "}
                        years
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Escalator</p>
                      <p className="font-medium">
                        {selectedProduct.escalationRate === 0
                          ? "0% (Fixed)"
                          : `${selectedProduct.escalationRate}%`}
                      </p>
                    </div>
                  </div>
                  {selectedProduct.totalAmountPaid && (
                    <p className="text-xs text-muted-foreground">
                      Total amount paid over term: $
                      {selectedProduct.totalAmountPaid.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleCreateQuote}
                disabled={creating || !selectedProductId}
              >
                {creating ? (
                  <Spinner className="mr-2 size-4" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                Create Quote
              </Button>
            </>
          )}

          {pricingProducts.length === 0 && !loadingPricing && (
            <p className="text-sm text-muted-foreground">
              Click "Load Pricing Options" to see available Comfort Plan
              products.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
