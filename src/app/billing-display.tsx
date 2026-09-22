import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/api/client";
import { CheckIcon } from "../routes/_app/billing";
import { formatNaira } from "../lib/format";

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  credits: number;
  features: string[];
  cta: string;
  status: "ACTIVE" | string;
}


export const billingPlanKeys = {
  active: ["billing", "plans", "active"] as const,
};

function getActivePlans() {
  return apiRequest<BillingPlan[]>("/billing/active/plans");
}

export function useActivePlans() {
  return useQuery({
    queryKey: billingPlanKeys.active,
    queryFn: getActivePlans,
    staleTime: 5 * 60 * 1000, 
    select: (plans) =>
      plans
        .filter((plan) => plan.status === "ACTIVE")
        .sort((a, b) => a.amount - b.amount),
  });
}


function parseFeatures(raw: string[] | undefined): string[] {
  if (!raw) return [];
  return raw.flatMap((entry) => {
    if (typeof entry === "string" && entry.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(entry);
        return Array.isArray(parsed) ? parsed.map(String) : [entry];
      } catch {
        return [entry];
      }
    }
    return [entry];
  });
}

const POPULAR_PLAN_NAME: string | null = "Starter";


export default function PricingPage() {
  const { data: plans, isLoading, isError, error } = useActivePlans();

  return (
    <section className="pricing-card">
      {isLoading ? (
        <div className="meter-empty" role="status">
          <p className="meter-empty-text">Loading plans…</p>
        </div>
      ) : isError ? (
        <div className="meter-empty" role="alert">
          <p className="meter-empty-text">
            Couldn't load plans
            {error instanceof Error ? `: ${error.message}` : "."}
          </p>
        </div>
      ) : !plans || plans.length === 0 ? (
        <div className="meter-empty">
          <p className="meter-empty-text">
            No active credit plans are available.
          </p>
        </div>
      ) : (
        <div className="plans-grid plans-grid--bundles">
          {plans.map((plan) => {
            const isPopular = plan.name === POPULAR_PLAN_NAME;
            const features = parseFeatures(plan.features);

            return (
              <article
                key={plan.id}
                className={`plan-card ${isPopular ? "plan-card--featured" : ""}`}
              >
                <div className="plan-head">
                  <h2 className="plan-name">{plan.name}</h2>
                  {isPopular ? (
                    <span className="plan-badge">Most popular</span>
                  ) : null}
                </div>

                <p className="plan-desc">{plan.description}</p>

                <div className="plan-pricing">
                  <h3 className="plan-price">{formatNaira(plan.amount)}</h3>
                  <p className="plan-rate">
                    {plan.credits.toLocaleString()} credits
                  </p>
                </div>

                <div className="plan-features-card">
                  <ul className="plan-features">
                    {features.map((feature) => (
                      <li className="plan-feature" key={feature}>
                        <CheckIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}