import {
  evaluateAdvertisingAiEligibilityPolicy,
  type AdvertisingAiEligibilityPolicyInput,
  type AdvertisingAiEligibilityPolicyResult,
} from "../../domains/advertising-ai/index.js";

export interface AdvertisingAiEligibilityService {
  evaluate(
    input:
      AdvertisingAiEligibilityPolicyInput
  ):
    AdvertisingAiEligibilityPolicyResult;
}

export function createAdvertisingAiEligibilityService():
  AdvertisingAiEligibilityService {
  return {
    evaluate(
      input
    ) {
      return evaluateAdvertisingAiEligibilityPolicy(
        input
      );
    },
  };
}